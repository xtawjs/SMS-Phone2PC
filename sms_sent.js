// ========== 配置 ==========
var user = "test"; //用户ID
var KEY = "mysecretkey";  // 约定的加解密密钥
var DEBUG = true;  // 调试模式 (true=启用, false=关闭)
var SERVER_URL = "http://192.168.2.9:11111/msg"; // 你的 Flask 服务器地址
// =========================

// 获取 Tasker 变量
var smsrf = global('SMSRF');  // 发件人
var smsrb = global('SMSRB');  // 短信内容
var smsrt = global('SMSRT').replace(/\./, ":"); // 短信时间
var smsrd = global('SMSRD');  // 短信日期
//var user = global('SMSRN');   // 可能是收件人
var pnum = global('PNUM').substring(3);  // 处理后的号码
var mmsrs = global('MMSRS');  // 彩信内容

// 判断是否有短信内容，如果没有则检查彩信内容
smsrb = (smsrb === "%SMSRB") ? (mmsrs === "%MMSRS") ? "无法获取短信内容" : mmsrs : smsrb;

// 加解密相关函数（使用简单异或加密）
function xorEncrypt(text, key) {
    var result = "";
    for (var i = 0; i < text.length; i++) {
         result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
}

// 支持 Unicode 的 Base64 编码函数
function base64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
       function(match, p1) {
           return String.fromCharCode('0x' + p1);
       }));
}

var xorResult = xorEncrypt(smsrb, KEY);
var encryptedMsg = base64EncodeUnicode(xorResult);

// 调试信息
if (DEBUG) {
    flash("短信信息:\n发件人: " + smsrf + "\n收件人: " + pnum + "\n时间: " + smsrt + "\n日期: " + smsrd + "\n内容: " + smsrb);
    flash("加密后内容: " + encryptedMsg);
}

// 发送到服务器的 JSON 数据
var payload = JSON.stringify({
    msg: encryptedMsg,
    user: user,
    timestamp: smsrd + " " + smsrt
});

// HTTP POST 请求函数
function postHttp(url, data) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                flash("发送成功: " + xhr.responseText);
            } else {
                flash("错误: HTTP " + xhr.status + "\n" + xhr.responseText);
                if (DEBUG) alert("HTTP " + xhr.status + "\n" + xhr.responseText);
            }
        }
    };

    xhr.onerror = function () {
        flash("网络错误: 无法连接到服务器!");
        if (DEBUG) alert("网络错误: 服务器未响应");
    };

    xhr.send(data);
}

// 发送短信信息到服务器
postHttp(SERVER_URL, payload);
