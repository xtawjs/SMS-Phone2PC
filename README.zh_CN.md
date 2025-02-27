# SMS-Phone2PC

[English Version](./README.md)

SMS-Phone2PC 是一个将手机短信同步到电脑端的工具，支持通过 Tasker 应用将手机短信发送到服务器，并通过 Python 或浏览器脚本获取短信内容。该项目特别适用于需要将短信验证码快速同步到电脑的场景。

## 项目特色

1. **多用户支持**：通过 `var user = "test";` 可以区分不同手机的短信。你可以在 Tasker 中设置多个任务，每个任务对应不同的用户 ID，从而区分不同系统的短信。
2. **加密传输**：使用 `var KEY = "mysecretkey";` 作为加解密密钥，确保短信内容在传输过程中的安全性。短信内容通过简单的 XOR 加密算法进行加密，确保数据不会被轻易窃取。

## 依赖库及许可证

- **Python 依赖库**:
  - `flask`: [BSD License](https://github.com/pallets/flask/blob/main/LICENSE.rst)
  - `waitress`: [ZPL 2.1](https://github.com/Pylons/waitress/blob/master/LICENSE.txt)
  - `requests`: [Apache 2.0](https://github.com/psf/requests/blob/main/LICENSE)
- **JavaScript 依赖库**:
  - `Tampermonkey`: [MIT License](https://tampermonkey.net/)

## 文件介绍

### 1. `sms_sent.js` - Tasker 短信发送脚本

此脚本用于在 Tasker 应用中触发短信发送事件，将短信内容加密后发送到服务器。

#### 需要调整的参数：

- `var user = "test";`：用户 ID，用于区分不同手机的短信。
- `var KEY = "mysecretkey";`：加解密密钥，确保传输安全。
- `var SERVER_URL = "http://192.168.2.9:11111/msg";`：服务器地址，确保与服务器端配置一致。

#### Tasker 导入代码的方法：

1. 打开 Tasker 应用，进入任务界面。
2. 点击右下角的 `+` 按钮，创建一个新任务。
3. 点击右下角的 `+` 按钮，创建一个新操作，选择 `代码-JavaScriptlet` 。
4. 将 `sms_sent.js` 的代码粘贴到代码框中。
5. 保存任务并在配置文件界面设置触发条件（如收到短信时触发）。

### 2. `sms_server.py` - 服务器端脚本

此脚本用于接收并存储来自手机的短信内容，支持通过 HTTP GET 请求查询最新短信。

#### 需要调整的参数：

- `serve(server, host="0.0.0.0", port=11111)`：服务器监听IP端口。

#### 开启服务器脚本的步骤：

1. 确保已安装 Python 3 和 `flask`、`waitress` 库。

2. 运行以下命令启动服务器：



   ```
   python sms_server.py
   ```
3. 加密态短信存储于`./msg.json`。


### 3. `sms_get.py` - Python 客户端脚本

此脚本用于从服务器获取最新短信内容，并进行解密。

#### 需要调整的参数：

- `TARGET_USER = "test";`：用户 ID，用于查询指定用户的短信。
- `SERVER_URL = "http://192.168.2.9:11111/msg";`：服务器地址，确保与服务器端配置一致。
- `KEY = "mysecretkey";`：加解密密钥，确保与发送端一致。

#### 使用方法：

1. 确保已安装 Python 3 和 `requests` 库。

2. 运行以下命令获取短信：



   ```
   python sms_get.py
   ```

### 4. `sms_get.js` - 油猴脚本

此脚本用于在浏览器中获取服务器上的短信内容，并自动提取验证码，置入剪贴板。

#### 需要调整的参数：

- `const SERVER_URL = "http://192.168.2.9:11111/msg?user=test";`：服务器地址和用户 ID，确保与服务器端配置一致。
- `const KEY = "mysecretkey";`：加解密密钥，确保与发送端一致。

#### 使用方法：

1. 安装 Tampermonkey 扩展。
2. 创建一个新脚本，将 `sms_get.js` 的代码粘贴到脚本编辑器中。
3. 保存脚本并刷新页面，页面右上角将出现“获取验证码”按钮。

## 许可证

本项目采用 MIT 许可证，详情请参阅 [LICENSE](https://./LICENSE) 文件。