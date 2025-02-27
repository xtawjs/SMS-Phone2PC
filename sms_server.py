import flask
import json
import datetime
import os
from flask import request
from waitress import serve  # 引入 Waitress WSGI 服务器

server = flask.Flask(__name__)
MSG_FILE = "msg.json"

# 初始化 msg.json 文件
if not os.path.exists(MSG_FILE):
    with open(MSG_FILE, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=4)


def save_message(msg_data):
    """保存短信到 msg.json 文件"""
    try:
        with open(MSG_FILE, "r", encoding="utf-8") as f:
            messages = json.load(f)
    except (json.JSONDecodeError, FileNotFoundError):
        messages = []

    messages.append(msg_data)  # 追加最新消息

    with open(MSG_FILE, "w", encoding="utf-8") as f:
        json.dump(messages, f, ensure_ascii=False, indent=4)


@server.route('/msg', methods=['GET', 'POST'])
def msg():
    """处理短信的接收与查询"""
    if request.method == "POST":
        data = request.json or request.form
        msg = data.get("msg")
        user = data.get("user", "未知用户")
        timestamp = data.get("timestamp", datetime.datetime.now().isoformat())

        if msg:
            msg_data = {"msg": msg, "user": user, "timestamp": timestamp}
            print(f"收到短信: {msg_data}")  # 终端调试输出
            save_message(msg_data)

            return json.dumps({'code': 200, 'message': '成功', 'data': msg_data}, ensure_ascii=False)
        else:
            return json.dumps({'code': 400, 'message': '失败', 'data': None}, ensure_ascii=False)

    elif request.method == "GET":
        # 读取指定 user 的最新一条短信
        try:
            with open(MSG_FILE, "r", encoding="utf-8") as f:
                messages = json.load(f)
            query_user = request.args.get("user", None)
            if query_user:
                latest_msg = None
                # 反向遍历，取指定用户的最新一条
                for m in reversed(messages):
                    if m.get("user") == query_user:
                        latest_msg = m
                        break
                if not latest_msg:
                    latest_msg = {"msg": "暂无数据"}
            else:
                latest_msg = messages[-1] if messages else {"msg": "暂无数据"}
        except (json.JSONDecodeError, FileNotFoundError):
            latest_msg = {"msg": "暂无数据"}

        print(f"查询最新短信: {latest_msg}")  # 终端调试输出
        return json.dumps(latest_msg, ensure_ascii=False)


if __name__ == '__main__':
    # 生产环境使用 Waitress WSGI 服务器
    serve(server, host="0.0.0.0", port=11111)
