// ==UserScript==
// @name         短信验证码提取器test
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  获取服务器短信中的验证码并复制到剪贴板（按钮气泡提示，按钮可拖动并记忆位置，右键菜单清除位置）
// @author       ChatGPT
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setClipboard
// @grant        GM_registerMenuCommand
// @connect      192.168.2.9
// ==/UserScript==
(function () {
    'use strict';
    // 仅在顶级窗口运行，避免在 iframe 内重复创建按钮
    if (window.top !== window.self) {
        return;
    }

    const SERVER_URL = "http://192.168.2.9:11111/msg?user=test";
    const KEY = "mysecretkey";  // 约定的加解密密钥
    const codeRegex = /\b\d{4,6}\b/;  // 4-6 位验证码匹配
    const DRAG_THRESHOLD = 5; // 拖动阈值，单位为像素

    // 添加 Tampermonkey 右键菜单
    GM_registerMenuCommand("清除按钮位置", function() {
        localStorage.removeItem("sms_code_btn_pos");
        alert("按钮位置已清除，刷新页面后生效！");
    });

    // 创建按钮
    function createButton() {
        if (document.getElementById("sms-code-btn")) return;

        let button = document.createElement("button");
        button.innerText = "✉️";
        button.id = "sms-code-btn";
        button.style.position = "fixed";
        button.style.zIndex = "9999";
        button.style.padding = "8px 12px";
        button.style.backgroundColor = "#007bff";
        button.style.color = "white";
        button.style.border = "none";
        button.style.borderRadius = "5px";
        button.style.cursor = "pointer";
        button.style.boxShadow = "0px 2px 5px rgba(0, 0, 0, 0.2)";
        button.style.fontSize = "14px";

        // 读取按钮位置
        let savedPos = localStorage.getItem("sms_code_btn_pos");
        if (savedPos) {
            try {
                let pos = JSON.parse(savedPos);
                button.style.left = pos.left + '%';
                button.style.top = pos.top + '%';
            } catch (e) {
                console.error("解析按钮位置失败", e);
            }
        } else {
            setTimeout(() => {
                button.style.left = ((window.innerWidth - button.offsetWidth - 10) / window.innerWidth * 100) + '%';
                button.style.top = ((window.innerHeight - button.offsetHeight - 50) / window.innerHeight * 100) + '%';
            }, 0);
        }

        let isDragging = false; // 标志位，用于区分拖动和点击
        let startX, startY; // 记录鼠标按下时的初始位置

        button.addEventListener("click", function(e) {
            if (isDragging) {
                isDragging = false; // 如果是拖动操作，不触发点击事件
                return;
            }
            fetchAndCopyCode();
        });

        document.body.appendChild(button);

        // 添加拖拽功能
        button.addEventListener("mousedown", function(e) {
            e.preventDefault();
            isDragging = false; // 初始化标志位
            startX = e.clientX; // 记录鼠标按下时的初始 X 坐标
            startY = e.clientY; // 记录鼠标按下时的初始 Y 坐标

            // 获取按钮的当前偏移量（百分比转换为像素）
            let buttonRect = button.getBoundingClientRect();
            let buttonLeft = (parseFloat(button.style.left) / 100) * window.innerWidth;
            let buttonTop = (parseFloat(button.style.top) / 100) * window.innerHeight;

            // 计算鼠标点击位置相对于按钮左上角的偏移量
            let shiftX = e.clientX - buttonLeft;
            let shiftY = e.clientY - buttonTop;

            function moveAt(pageX, pageY) {
                // 检查是否超过拖动阈值
                if (!isDragging) {
                    let deltaX = Math.abs(pageX - startX);
                    let deltaY = Math.abs(pageY - startY);
                    if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
                        isDragging = true; // 超过阈值，认为是拖动操作
                    }
                }

                if (isDragging) {
                    // 计算新的按钮位置（百分比）
                    let newLeft = ((pageX - shiftX) / window.innerWidth) * 100;
                    let newTop = ((pageY - shiftY) / window.innerHeight) * 100;

                    // 限制按钮在窗口范围内
                    newLeft = Math.max(0, Math.min(newLeft, 100));
                    newTop = Math.max(0, Math.min(newTop, 100));

                    button.style.left = newLeft + '%';
                    button.style.top = newTop + '%';
                }
            }

            function onMouseMove(e) {
                moveAt(e.pageX, e.pageY);
            }

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                if (isDragging) {
                    localStorage.setItem("sms_code_btn_pos", JSON.stringify({
                        left: parseFloat(button.style.left),
                        top: parseFloat(button.style.top)
                    }));
                }
            });
        });

        button.ondragstart = function() {
            return false;
        };
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
                                showTooltip(decryptedMsg);
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

    // 显示气泡提示
    function showTooltip(message) {
        let tooltip = document.createElement("div");
        tooltip.innerText = message;
        tooltip.style.position = "fixed";
        tooltip.style.top = "10px";
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

    // 页面加载后创建按钮
    window.addEventListener("load", createButton);
})();