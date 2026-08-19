# Mail Agent Old School v2

Старый компактный мессенджер на Firebase.

## Возможности
- Email/password регистрация и вход
- Google Sign-In
- Список пользователей и поиск
- Онлайн/оффлайн статус
- Личные чаты
- Сообщения в реальном времени
- История сообщений
- Firestore Security Rules
- Storage Rules для будущих файлов

## Firebase
Проект: `chatss-daa4b`

Включить:
- Authentication → Email/Password
- Authentication → Google
- Firestore Database
- Storage (для файлов в следующей версии)

Правила находятся в `firestore.rules` и `storage.rules`.

## Запуск
Открыть через локальный web-сервер, например:

```bash
python -m http.server 5500
```

Затем открыть `http://localhost:5500`.

## Структура
- `index.html` — интерфейс
- `style.css` — old-school дизайн
- `app.js` — Firebase Auth + Firestore
- `firestore.rules` — правила Firestore
- `storage.rules` — правила Storage