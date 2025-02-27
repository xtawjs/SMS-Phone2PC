// ==UserScript==
// @name         短信验证码提取器（带气泡提示）
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  获取服务器短信中的验证码并复制到剪贴板（按钮气泡提示）
// @author       ChatGPT
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @connect      192.168.2.9
// ==/UserScript==

(function () {
    'use strict';

    const SERVER_URL = "http://192.168.2.9:11111/msg?user=test";
    const KEY = "mysecretkey";  // 约定的加解密密钥
    const codeRegex = /\b\d{4,6}\b/;  // 4-6 位验证码匹配

    // 创建按钮
    function createButton() {
        let button = document.createElement("button");
        button.innerText = "获取验证码";
        button.id = "sms-code-btn";
        button.style.position = "fixed";
        button.style.top = "10px";
        button.style.right = "10px";
        button.style.zIndex = "9999";
        button.style.padding = "8px 12px";
        button.style.backgroundColor = "#007bff";
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "5px";
        button.style.cursor = "pointer";
        button.style.boxShadow = "0px 2px 5px rgba(0, 0, 0, 0.2)";
        button.style.fontSize = "14px";

        button.addEventListener("click", fetchAndCopyCode);
        document.body.appendChild(button);
    }

    // 显示气泡提示（优化位置）
    function showTooltip(button, message) {
        let tooltip = document.createElement("div");
        tooltip.innerText = message;
        tooltip.style.position = "fixed";
        tooltip.style.top = `${button.getBoundingClientRect().bottom + window.scrollY + 5}px`; // 按钮下方 5px
        tooltip.style.left = `${button.getBoundingClientRect().left + window.scrollX}px`;
        tooltip.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        tooltip.style.color = "white";
        tooltip.style.padding = "6px 10px";
        tooltip.style.borderRadius = "5px";
        tooltip.style.fontSize = "14px";
        tooltip.style.whiteSpace = "nowrap";
        tooltip.style.zIndex = "10000";
        tooltip.style.transition = "opacity 0.3s";
        tooltip.style.opacity = "1";

        document.body.appendChild(tooltip);

        setTimeout(() => {
            tooltip.style.opacity = "0";
            setTimeout(() => tooltip.remove(), 300);
        }, 2000);
    }

    // Base64 解码
    function base64DecodeUnicode(str) {
        return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    // XOR 解密
    function xorDecrypt(text, key) {
        let result = "";
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        return result;
    }

    // 获取短信并匹配验证码
    function fetchAndCopyCode() {
        GM_xmlhttpRequest({
            method: "GET",
            url: SERVER_URL,
            responseType: "json",
            onload: function (response) {
                let button = document.getElementById("sms-code-btn");
                if (!button) return;

                if (response.status === 200) {
                    let data = response.response;
                    let encryptedMsg = data.msg || "";

                    if (encryptedMsg !== "暂无数据") {
                        try {
                            let decodedMsg = base64DecodeUnicode(encryptedMsg);
                            let decryptedMsg = xorDecrypt(decodedMsg, KEY);
                            let match = decryptedMsg.match(codeRegex);

                            if (match) {
                                let code = match[0];
                                GM_setClipboard(code);
                                showTooltip(button, `${code}`);
                            } else {
                                showTooltip(button, "未找到验证码");
                            }
                        } catch (e) {
                            showTooltip(button, "解码失败");
                        }
                    } else {
                        showTooltip(button, "暂无数据");
                    }
                } else {
                    showTooltip(button, `请求失败: ${response.status}`);
                }
            },
            onerror: function () {
                let button = document.getElementById("sms-code-btn");
                if (button) showTooltip(button, "无法连接到服务器");
            }
        });
    }

    // 页面加载后创建按钮
    window.addEventListener("load", createButton);
})();
