from flask import Flask, render_template, request, jsonify
import requests
from waitress import serve  # 导入 Waitress

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_message', methods=['POST'])
def get_message():
    user = request.form.get('user')
    server_url = request.form.get('server_url', 'http://server_ip:11111/msg')

    try:
        params = {"user": user}
        response = requests.get(server_url, params=params)
        if response.status_code == 200:
            data = response.json()
            encrypted_msg = data.get('msg', '')
            return jsonify({
                'user': data.get('user', '未知'),
                'timestamp': data.get('timestamp', '未知'),
                'message': encrypted_msg
            })
        else:
            return jsonify({'error': f"获取失败，HTTP 状态码: {response.status_code}"}), 400
    except requests.RequestException as e:
        return jsonify({'error': f"请求错误: {e}"}), 500

if __name__ == '__main__':
    # 使用 Waitress 运行应用
    serve(app, host='0.0.0.0', port=11112)