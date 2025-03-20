from flask import Flask, render_template, request, jsonify
import requests
import base64
import webbrowser  # 导入 webbrowser 模块
from threading import Timer  # 导入 Timer 用于延迟打开浏览器

app = Flask(__name__)

# 动态设置模板文件夹路径
import os
template_dir = os.path.abspath('templates')
app.template_folder = template_dir

def xor_encrypt_decrypt(text, key):
    """简单的异或加解密函数"""
    return ''.join(chr(ord(c) ^ ord(key[i % len(key)])) for i, c in enumerate(text))

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_message', methods=['POST'])
def get_message():
    user = request.form.get('user')
    key = request.form.get('key')
    server_url = request.form.get('server_url', 'http://server_ip:11111/msg')

    try:
        params = {"user": user}
        response = requests.get(server_url, params=params)
        if response.status_code == 200:
            data = response.json()
            encrypted_msg = data.get('msg', '')
            if encrypted_msg != "暂无数据":
                try:
                    decoded = base64.b64decode(encrypted_msg).decode('utf-8')
                    decrypted_msg = xor_encrypt_decrypt(decoded, key)
                except Exception as e:
                    decrypted_msg = f"解密错误: {e}"
            else:
                decrypted_msg = encrypted_msg
            return jsonify({
                'user': data.get('user', '未知'),
                'timestamp': data.get('timestamp', '未知'),
                'message': decrypted_msg
            })
        else:
            return jsonify({'error': f"获取失败，HTTP 状态码: {response.status_code}"}), 400
    except requests.RequestException as e:
        return jsonify({'error': f"请求错误: {e}"}), 500

def open_browser():
    """在默认浏览器中打开应用的 URL"""
    webbrowser.open_new('http://127.0.0.1:5000/')

if __name__ == '__main__':
    # 延迟 1 秒后打开浏览器
    Timer(1, open_browser).start()
    # 运行 Flask 应用
    app.run(debug=False)