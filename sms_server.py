import flask
import json
import datetime
from flask import request
from waitress import serve
from collections import deque
import threading

server = flask.Flask(__name__)

# 使用 deque 存储消息，最大长度设置为 100
messages = deque(maxlen=100)
# 定义全局锁，保证对 messages 的并发访问安全
messages_lock = threading.Lock()


@server.route('/msg', methods=['GET', 'POST'])
def msg():
    if request.method == "POST":
        data = request.json or request.form
        msg_text = data.get("msg")
        user = data.get("user", "未知用户")
        timestamp = data.get("timestamp", datetime.datetime.now().isoformat())

        if msg_text:
            msg_data = {"msg": msg_text, "user": user, "timestamp": timestamp}
            print(f"收到短信: {msg_data}")  # 终端调试输出
            # 使用锁保护写操作
            with messages_lock:
                messages.append(msg_data)

            return json.dumps({'code': 200, 'message': '成功', 'data': msg_data}, ensure_ascii=False)
        else:
            return json.dumps({'code': 400, 'message': '失败', 'data': None}, ensure_ascii=False)

    elif request.method == "GET":
        query_user = request.args.get("user")
        # 未指定 user 或 user 为空时，直接返回 "暂无消息"
        if not query_user:
            latest_msg = {"msg": "暂无消息"}
        else:
            with messages_lock:
                latest_msg = None
                # 反向遍历，查找指定用户的最新一条消息
                for m in reversed(messages):
                    if m.get("user") == query_user:
                        latest_msg = m
                        break
            # 如果没有对应 user 的消息，也返回 "暂无消息"
            if not latest_msg:
                latest_msg = {"msg": "暂无消息"}

        print(f"查询最新短信: {latest_msg}")  # 终端调试输出
        return json.dumps(latest_msg, ensure_ascii=False)


if __name__ == '__main__':
    # 使用 Waitress WSGI 服务器运行
    serve(server, host="0.0.0.0", port=11111)
