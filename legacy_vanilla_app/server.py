"""
Stock Price Tracker - Proxy Server
Handles CORS issues with Yahoo Finance API and serves static files.
"""

import http.server
import urllib.request
import urllib.error
import json
import os

PORT = 8080

class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/chart/'):
            self.proxy_yahoo_finance()
        elif self.path.startswith('/api/search/'):
            self.proxy_yahoo_search()
        elif self.path.startswith('/api/quote/'):
            self.proxy_yahoo_quote()
        else:
            super().do_GET()

    def proxy_yahoo_finance(self):
        """Proxy requests to Yahoo Finance chart API"""
        # Extract symbol and query params
        path_part = self.path[len('/api/chart/'):]
        symbol = path_part.split('?')[0]
        query_string = path_part.split('?')[1] if '?' in path_part else 'interval=1m&range=1d'
        
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?{query_string}"
        
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = response.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8', errors='replace')
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'error': f'Yahoo Finance API error: {e.code}',
                'details': error_body
            }).encode())
        except Exception as e:
            self.send_response(503)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Server unavailable - retrying', 'details': str(e)}).encode())

    def proxy_yahoo_search(self):
        """Proxy requests to Yahoo Finance search/quote API for autocomplete"""
        query = self.path[len('/api/search/'):]
        url = f"https://query2.finance.yahoo.com/v1/finance/search?q={query}&quotesCount=8&newsCount=0&region=IN&lang=en-IN"
        
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = response.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())

    def proxy_yahoo_quote(self):
        """Proxy requests to Yahoo Finance quote API for rapid price updates"""
        symbol = self.path[len('/api/quote/'):]
        url = f"https://query1.finance.yahoo.com/v7/finance/quote?symbols={symbol}"
        
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
            with urllib.request.urlopen(req, timeout=5) as response:
                data = response.read()
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(data)
        except Exception as e:
            self.send_response(503)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Server unavailable - retrying', 'details': str(e)}).encode())

    def log_message(self, format, *args):
        """Custom log format"""
        print(f"[Server] {args[0]}")

if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = http.server.HTTPServer(('', PORT), ProxyHandler)
    print(f"\n  Stock Tracker Server running at http://localhost:{PORT}")
    print(f"  Open http://localhost:{PORT}/index.html in your browser\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server stopped.")
        server.server_close()
