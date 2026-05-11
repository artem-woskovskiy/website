import hashlib
import base64
import os
import secrets
import webbrowser
import requests
import time

# Конфигурация (соответствует seed-данным от Devin)
CLIENT_ID = "ide-desktop"
REDIRECT_URI = "http://localhost:3000/oauth/callback"
AUTHORIZE_URL = "http://localhost:3000/oauth/authorize" # Next.js Web
TOKEN_URL = "http://localhost:4000/api/oauth/token"      # NestJS API

def generate_pkce():
    # Code Verifier: случайная строка
    verifier = secrets.token_urlsafe(64)
    
    # Code Challenge: SHA256 хеш от verifier
    sha256 = hashlib.sha256(verifier.encode('utf-8')).digest()
    challenge = base64.urlsafe_b64encode(sha256).decode('utf-8').replace('=', '')
    
    return verifier, challenge

def main():
    print("=== Sepaito OAuth IDE Test Simulator ===")
    
    # 1. Генерация PKCE
    verifier, challenge = generate_pkce()
    print(f"[1] PKCE Verifier generated.")
    
    # 2. Формирование URL для браузера
    state = secrets.token_urlsafe(16)
    auth_url = (
        f"{AUTHORIZE_URL}?response_type=code"
        f"&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&code_challenge={challenge}"
        f"&code_challenge_method=S256"
        f"&state={state}"
        f"&scope=profile"
    )
    
    print(f"\n[2] Opening browser for authorization...")
    print(f"URL: {auth_url}")
    webbrowser.open(auth_url)
    
    print("\n" + "="*50)
    print("ИНСТРУКЦИЯ:")
    print("1. В браузере войдите в аккаунт и нажмите 'Allow'.")
    print("2. После этого браузер попытается открыть 'sepaito://oauth/callback?code=...'")
    print("3. Скопируйте ВСЮ эту ссылку из адресной строки браузера и вставьте сюда.")
    print("="*50)
    
    callback_url = input("\nВставьте полученную ссылку (callback URL): ").strip()
    
    # 3. Извлечение кода из ссылки
    if "code=" not in callback_url:
        print("Ошибка: Ссылка не содержит кода авторизации.")
        return
        
    code = callback_url.split("code=")[1].split("&")[0]
    print(f"\n[3] Extracted Code: {code}")
    
    # 4. Обмен кода на токен
    print("\n[4] Exchanging code for tokens...")
    payload = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "code": code,
        "redirect_uri": REDIRECT_URI,
        "code_verifier": verifier
    }
    
    try:
        response = requests.post(TOKEN_URL, data=payload)
        if response.status_code == 200:
            tokens = response.json()
            print("\nУСПЕХ! Токены получены:")
            print(f"Access Token: {tokens.get('access_token')[:30]}...")
            print(f"Refresh Token: {tokens.get('refresh_token')[:30]}...")
            print(f"Expires In: {tokens.get('expires_in')}s")
            
            print("\nТеперь вы можете зайти в /account/devices на сайте и увидеть это 'устройство'!")
        else:
            print(f"\nОШИБКА: Сервер вернул {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"\nОшибка при запросе: {e}")

if __name__ == "__main__":
    main()
