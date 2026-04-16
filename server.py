#!/usr/bin/env python3
"""
Servidor do FNPM v2 — serve arquivos estáticos e salva leads em CSV.
Uso: python3 server.py
Acesse: http://localhost:8080
"""

import http.server
import json
import csv
import os
from datetime import datetime
from urllib.parse import unquote

PORT = 8080
CSV_FILE = 'leads.csv'


class GameHandler(http.server.SimpleHTTPRequestHandler):

    def do_POST(self):
        if self.path == '/api/lead':
            self._save_lead()
        else:
            self.send_error(404)

    def _save_lead(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            data = json.loads(body)

            nome = str(data.get('nome', '')).strip()[:200]
            email = str(data.get('email', '')).strip()[:200]

            if not nome or not email:
                self._json_response(400, {'error': 'nome e email obrigatórios'})
                return

            file_exists = os.path.isfile(CSV_FILE)
            with open(CSV_FILE, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow(['data_hora', 'nome', 'email'])
                writer.writerow([
                    datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    nome,
                    email
                ])

            self._json_response(200, {'ok': True})

        except (json.JSONDecodeError, ValueError):
            self._json_response(400, {'error': 'JSON inválido'})

    def _json_response(self, code, obj):
        body = json.dumps(obj).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()


if __name__ == '__main__':
    print(f'Servidor FNPM rodando em http://localhost:{PORT}')
    print(f'Leads serão salvos em {CSV_FILE}')
    server = http.server.HTTPServer(('', PORT), GameHandler)
    server.serve_forever()
