import requests
import base64

TARGET_USER = "test"  # 请将此处替换为你需要查询的用户
SERVER_URL = "http://server_ip:11111/msg"  # 修改为 Flask 服务器地址
KEY = "mysecretkey"  # 约定的加解密密钥

def xor_encrypt_decrypt(text, key):
    """简单的异或加解密函数"""
    print(text)
    return ''.join(chr(ord(c) ^ ord(key[i % len(key)])) for i, c in enumerate(text))

try:
    params = {"user": TARGET_USER}
    response = requests.get(SERVER_URL, params=params)
    if response.status_code == 200:
        data = response.json()
        encrypted_msg = data.get('msg', '')
        print(encrypted_msg)
        # 如果返回的数据为"暂无数据"，则不进行解密
        if encrypted_msg != "暂无数据":
            try:
                # 先将 Base64 解码，再进行 XOR 解密
                decoded = base64.b64decode(encrypted_msg).decode('utf-8')
            except Exception as e:
                decoded = ""
                print(f"Base64 解码错误: {e}")
            decrypted_msg = xor_encrypt_decrypt(decoded, KEY)
        else:
            decrypted_msg = encrypted_msg
        print(f"最新短信:\n发件人: {data.get('user', '未知')}\n时间: {data.get('timestamp', '未知')}\n内容: {decrypted_msg}")
    else:
        print(f"获取失败，HTTP 状态码: {response.status_code}")
except requests.RequestException as e:
    print(f"请求错误: {e}")
