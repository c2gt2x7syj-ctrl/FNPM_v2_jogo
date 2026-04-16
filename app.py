#!/usr/bin/env python3
"""
FNPM v2 — Servidor Flask para Render.
Serve arquivos estáticos e salva leads em CSV.
"""

import os
import csv
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder='.', static_url_path='')

CSV_FILE = 'leads.csv'


@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


@app.route('/api/lead', methods=['POST'])
def save_lead():
    try:
        data = request.get_json(force=True)
        nome = str(data.get('nome', '')).strip()[:200]
        email = str(data.get('email', '')).strip()[:200]

        if not nome or not email:
            return jsonify({'error': 'nome e email obrigatórios'}), 400

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

        return jsonify({'ok': True}), 200

    except Exception:
        return jsonify({'error': 'JSON inválido'}), 400


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
