"""Run the library's tts_zh.py with certifi pointed at the system/proxy CA bundle (edge-tts pins certifi)."""
import os, sys, runpy, certifi
ca = os.environ.get('SSL_CERT_FILE')
if ca and os.path.exists(ca):
    certifi.where = lambda: ca
sys.argv = sys.argv[1:]
runpy.run_path(sys.argv[0], run_name='__main__')
