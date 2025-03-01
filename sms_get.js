// ==UserScript==
// @name         短信验证码提取器（带气泡提示）
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  获取服务器短信中的验证码并复制到剪贴板（按钮气泡提示，按钮可拖动并记忆位置）
// @author       ChatGPT
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @connect      server_ip
// ==/UserScript==

(function () {
    'use strict';
    // 仅在顶级窗口运行，避免在嵌套的 iframe 中重复创建按钮
    if (window.top !== window.self) {
        return;
    }

    const SERVER_URL = "http://server_ip:11111/msg?user=test";
    const KEY = "mysecretkey";  // 约定的加解密密钥
    const codeRegex = /\b\d{4,6}\b/;  // 4-6 位验证码匹配

    // 创建按钮
    function createButton() {
        // 如果按钮已存在，则不重复创建
        if (document.getElementById("sms-code-btn")) return;

        let button = document.createElement("button");
        button.innerText = "✉️";
        button.id = "sms-code-btn";
        button.style.position = "fixed";
        button.style.top = "10px";
        button.style.left = "10px";
        button.style.zIndex = "9999";
        button.style.padding = "8px 12px";
        button.style.backgroundColor = "#007bff";
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "5px";
        button.style.cursor = "pointer";
        button.style.boxShadow = "0px 2px 5px rgba(0, 0, 0, 0.2)";
        button.style.fontSize = "14px";

        // 从 localStorage 中恢复按钮位置（如果有保存）
        let savedPos = localStorage.getItem("sms_code_btn_pos");
        if (savedPos) {
            try {
                let pos = JSON.parse(savedPos);
                button.style.left = pos.left;
                button.style.top = pos.top;
            } catch (e) {
                console.error("解析按钮位置失败", e);
            }
        }

        button.addEventListener("click", fetchAndCopyCode);
        document.body.appendChild(button);

        // 添加拖拽功能
        button.addEventListener("mousedown", function(e) {
            e.preventDefault();
            let shiftX = e.clientX - button.getBoundingClientRect().left;
            let shiftY = e.clientY - button.getBoundingClientRect().top;

            function moveAt(pageX, pageY) {
                button.style.left = pageX - shiftX + 'px';
                button.style.top = pageY - shiftY + 'px';
            }

            function onMouseMove(e) {
                moveAt(e.pageX, e.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);

            document.addEventListener('mouseup', function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                // 保存当前位置到 localStorage
                localStorage.setItem("sms_code_btn_pos", JSON.stringify({ left: button.style.left, top: button.style.top }));
            });
        });

        // 禁用默认拖拽行为
        button.ondragstart = function() {
            return false;
        };
    }

    // 显示气泡提示（顶部居中显示）
    function showTooltip(message) {
        let tooltip = document.createElement("div");
        tooltip.innerText = message;
        tooltip.style.position = "fixed";
        tooltip.style.top = "10px";  // 距离顶部 10px
        tooltip.style.left = "50%";
        tooltip.style.transform = "translateX(-50%)";
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
                                showTooltip(decryptedMsg);
                            } else {
                                showTooltip("未找到验证码");
                            }
                        } catch (e) {
                            showTooltip("解码失败");
                        }
                    } else {
                        showTooltip("暂无数据");
                    }
                } else {
                    showTooltip(`请求失败: ${response.status}`);
                }
            },
            onerror: function () {
                showTooltip("无法连接到服务器");
            }
        });
    }

    // 页面加载后创建按钮
    window.addEventListener("load", createButton);
})();
