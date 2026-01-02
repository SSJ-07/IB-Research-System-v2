import logging
import os
import sys
import time
from collections import namedtuple
from logging import Formatter
from threading import Lock
from typing import Any, Dict, Optional, Set, List

import requests
from fastapi import HTTPException
# from google.cloud import storage

from scholarqa import glog
from scholarqa.llms.litellm_helper import setup_llm_cache

logger = logging.getLogger(__name__)

S2_APIKEY = os.getenv("SEMANTIC_SCHOLAR_API_KEY")
# Only include API key in headers if it's set and not empty
if S2_APIKEY:
    S2_HEADERS = {"x-api-key": S2_APIKEY}
else:
    S2_HEADERS = {}
    logger.warning("SEMANTIC_SCHOLAR_API_KEY not set - Semantic Scholar API requests may fail")
S2_API_BASE_URL = "https://api.semanticscholar.org/graph/v1/"

# Rate limiting for Semantic Scholar API (1 request per second)
_last_request_time = 0
_rate_limit_lock = Lock()
_MIN_REQUEST_INTERVAL = 1.0  # 1 second minimum between requests
CompletionResult = namedtuple("CompletionCost",
                              ["content", "model", "cost", "input_tokens", "output_tokens", "total_tokens"])
NUMERIC_META_FIELDS = {"year", "citationCount", "referenceCount", "influentialCitationCount"}
CATEGORICAL_META_FIELDS = {"title", "abstract", "corpusId", "authors", "venue", "isOpenAccess", "openAccessPdf"}
METADATA_FIELDS = ",".join(CATEGORICAL_META_FIELDS.union(NUMERIC_META_FIELDS))


class TaskIdAwareLogFormatter(Formatter):
    def __init__(self, task_id: str = ""):
        super().__init__("%(asctime)s - %(name)s - %(levelname)s")
        self.task_id = task_id

    def format(self, record):
        og_message = super().format(record)
        task_id_part = f"[{self.task_id}] " if self.task_id else ""
        return f"{og_message} - {task_id_part}- {record.getMessage()}"


def init_settings(logs_dir: str, log_level: str = "INFO",
                  litellm_cache_dir: str = "litellm_cache") -> TaskIdAwareLogFormatter:
    def setup_logging() -> TaskIdAwareLogFormatter:
        # If LOG_FORMAT is "google:json" emit log message as JSON in a format Google Cloud can parse
        loggers = [
            "LiteLLM Proxy",
            "LiteLLM Router",
            "LiteLLM"
        ]

        for logger_name in loggers:
            litellm_logger = logging.getLogger(logger_name)
            litellm_logger.setLevel(logging.WARNING)

        fmt = os.getenv("LOG_FORMAT")
        tid_log_fmt = TaskIdAwareLogFormatter()
        if fmt == "google:json":
            handlers = [glog.Handler()]
            for handler in handlers:
                handler.setFormatter(glog.Formatter(tid_log_fmt))
        else:
            handlers = []
            # log lower levels to stdout
            stdout_handler = logging.StreamHandler(stream=sys.stdout)
            stdout_handler.addFilter(lambda rec: rec.levelno <= logging.INFO)
            handlers.append(stdout_handler)

            # log higher levels to stderr (red)
            stderr_handler = logging.StreamHandler(stream=sys.stderr)
            stderr_handler.addFilter(lambda rec: rec.levelno > logging.INFO)
            handlers.append(stderr_handler)
            for handler in handlers:
                handler.setFormatter(tid_log_fmt)

        level = log_level
        logging.basicConfig(level=level, handlers=handlers)
        return tid_log_fmt

    def setup_local_llm_cache():
        # Local logs directory for litellm caching, event traces and state management
        local_cache_dir = f"{logs_dir}/{litellm_cache_dir}"
        # create parent and subdirectories for the local cache
        os.makedirs(local_cache_dir, exist_ok=True)
        setup_llm_cache(cache_type="disk", disk_cache_dir=local_cache_dir)

    tid_log_fmt = setup_logging()
    setup_local_llm_cache()
    return tid_log_fmt


def make_int(x: Optional[Any]) -> int:
    try:
        return int(x)
    except:
        return 0


def get_ref_author_str(authors: List[Dict[str, str]]) -> str:
    if not authors:
        return "NULL"
    f_author_lname = authors[0]["name"].split()[-1]
    return f_author_lname if len(authors) == 1 else f"{f_author_lname} et al."


def query_s2_api(
        end_pt: str = "paper/batch",
        params: Dict[str, Any] = None,
        payload: Dict[str, Any] = None,
        method="get",
):
    global _last_request_time
    
    if not S2_APIKEY:
        error_msg = "SEMANTIC_SCHOLAR_API_KEY is not set. Please set it in your .env file."
        logger.error(error_msg)
        raise HTTPException(
            status_code=500,
            detail=error_msg,
        )
    
    # Rate limiting: ensure at least 1 second between requests
    with _rate_limit_lock:
        current_time = time.time()
        time_since_last = current_time - _last_request_time
        
        if time_since_last < _MIN_REQUEST_INTERVAL:
            sleep_time = _MIN_REQUEST_INTERVAL - time_since_last
            logger.debug(f"Rate limiting: sleeping for {sleep_time:.2f} seconds before {end_pt} request")
            time.sleep(sleep_time)
        
        _last_request_time = time.time()
    
    url = S2_API_BASE_URL + end_pt
    req_method = requests.get if method == "get" else requests.post
    response = req_method(url, headers=S2_HEADERS, params=params, json=payload)
    if response.status_code != 200:
        error_detail = f"S2 API request to end point {end_pt} failed with status code {response.status_code}"
        if response.status_code == 403:
            error_detail += ". This usually means your SEMANTIC_SCHOLAR_API_KEY is invalid, expired, or lacks required permissions. Please check your API key."
        elif response.status_code == 401:
            error_detail += ". Authentication failed. Please verify your SEMANTIC_SCHOLAR_API_KEY is correct."
        elif response.status_code == 429:
            error_detail += ". Rate limit exceeded. The system should automatically handle this with rate limiting, but you may need to wait longer between requests."
        logging.exception(error_detail)
        raise HTTPException(
            status_code=500,
            detail=error_detail,
        )
    return response.json()


def get_paper_metadata(corpus_ids: Set[str]) -> Dict[str, Any]:
    paper_data = query_s2_api(
        end_pt="paper/batch",
        params={
            "fields": METADATA_FIELDS
        },
        payload={"ids": ["CorpusId:{0}".format(cid) for cid in corpus_ids]},
        method="post",
    )
    paper_metadata = {
        str(pdata["corpusId"]): {k: make_int(v) if k in NUMERIC_META_FIELDS else pdata.get(k) for k, v in pdata.items()}
        for pdata in paper_data if pdata and "corpusId" in pdata
    }
    return paper_metadata


def push_to_gcs(text: str, bucket: str, file_path: str):
    try:
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket)
        blob = bucket.blob(file_path)
        blob.upload_from_string(text)
        logging.info(f"Pushed event trace: {file_path} to GCS")
    except Exception as e:
        logging.info(f"Error pushing {file_path} to GCS: {e}")
