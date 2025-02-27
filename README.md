# SMS-Phone2PC

 [中文版](./README.zh_CN.md)

SMS-Phone2PC is a tool that synchronizes SMS messages from your phone to your PC. It supports sending SMS messages from the Tasker app to a server and retrieving the SMS content via Python or browser scripts. This project is particularly useful for quickly synchronizing SMS verification codes to your PC.

## Features

1. **Multi-User Support**: By using `var user = "test";`, you can distinguish SMS messages from different phones. You can set up multiple tasks in Tasker, each corresponding to a different user ID, to differentiate SMS messages from different systems.
2. **Encrypted Transmission**: The `var KEY = "mysecretkey";` is used as the encryption/decryption key to ensure the security of SMS content during transmission. The SMS content is encrypted using a simple XOR encryption algorithm to ensure data is not easily intercepted.

## Dependencies and Licenses

- **Python Dependencies**:
  - `flask`: [BSD License](https://github.com/pallets/flask/blob/main/LICENSE.rst)
  - `waitress`: [ZPL 2.1](https://github.com/Pylons/waitress/blob/master/LICENSE.txt)
  - `requests`: [Apache 2.0](https://github.com/psf/requests/blob/main/LICENSE)
- **JavaScript Dependencies**:
  - `Tampermonkey`: [MIT License](https://tampermonkey.net/)

## File Descriptions

### 1. `sms_sent.js` - Tasker SMS Sending Script

This script is used in the Tasker app to trigger SMS sending events, encrypt the SMS content, and send it to the server.

#### Parameters to Adjust:

- `var user = "test";`: User ID to distinguish SMS messages from different phones.
- `var KEY = "mysecretkey";`: Encryption/decryption key to ensure secure transmission.
- `var SERVER_URL = "http://192.168.2.9:11111/msg";`: Server URL, ensure it matches the server configuration.

#### How to Import Code in Tasker:

1. Open the Tasker app and go to the Tasks section.
2. Click the `+` button at the bottom right to create a new task.
3. Select `JavaScript` as the action type.
4. Paste the code from `sms_sent.js` into the code box.
5. Save the task and set the trigger condition (e.g., trigger when an SMS is received).

### 2. `sms_server.py` - Server-Side Script

This script is used to receive and store SMS content from the phone and supports querying the latest SMS via HTTP GET requests.

#### Parameters to Adjust:

- `SERVER_URL = "http://192.168.2.9:11111/msg";`: Server URL, ensure it matches the client configuration.

#### Steps to Start the Server Script:

1. Ensure Python 3 and the `flask`, `waitress` libraries are installed.

2. Run the following command to start the server:



   ```
   python sms_server.py
   ```

3. The server will run on `http://192.168.2.9:11111`.

### 3. `sms_get.py` - Python Client Script

This script is used to retrieve the latest SMS content from the server and decrypt it.

#### Parameters to Adjust:

- `TARGET_USER = "test";`: User ID to query SMS messages for a specific user.
- `SERVER_URL = "http://192.168.2.9:11111/msg";`: Server URL, ensure it matches the server configuration.
- `KEY = "mysecretkey";`: Encryption/decryption key, ensure it matches the sender's configuration.

#### Usage:

1. Ensure Python 3 and the `requests` library are installed.

2. Run the following command to retrieve SMS messages:



   ```
   python sms_get.py
   ```

### 4. `sms_get.js` - Tampermonkey Script

This script is used to retrieve SMS content from the server in the browser and automatically extract verification codes.

#### Parameters to Adjust:

- `const SERVER_URL = "http://192.168.2.9:11111/msg?user=test";`: Server URL and user ID, ensure it matches the server configuration.
- `const KEY = "mysecretkey";`: Encryption/decryption key, ensure it matches the sender's configuration.

#### Usage:

1. Install the Tampermonkey extension.
2. Create a new script and paste the code from `sms_get.js` into the script editor.
3. Save the script and refresh the page. A "Get Verification Code" button will appear at the top right of the page.

## License

This project is licensed under the MIT License. See the [LICENSE](https://./LICENSE) file for details.