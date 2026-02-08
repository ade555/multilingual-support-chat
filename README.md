# Multilingual Support Chat System

A real-time customer support chat application that automatically translates messages between customers and agents, enabling seamless communication across language barriers.

## Features

- **Automatic Language Detection**: Detects customer's language automatically using Lingo.dev API
- **Real-time Translation**: Translates messages bidirectionally between customer and agent languages
- **Live Communication**: WebSocket-based real-time messaging with Socket.io
- **Agent Workspace**: Unified inbox where agents work in their preferred language
- **Conversation Management**: Resolve, escalate, or end conversations
- **Persistent Sessions**: Conversations saved to disk and restored on server restart

## Tech Stack

**Frontend:**

- React
- Tailwind CSS
- Socket.io Client

**Backend:**

- Node.js
- Express
- Socket.io
- Lingo.dev API for translation

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Lingo.dev API key ([Get one here](https://lingo.dev))

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/ade555/multilingual-support-chat.git
cd multilingual-support-chat
```

2. **Install dependencies**

For the server:

```bash
cd server
npm install
```

For the client:

```bash
cd client
npm install
```

3. **Set up environment variables**

Create a `.env` file in the `server` directory:

```env
 LINGODOTDEV_API_KEY=
 PORT=3000
 CLIENT_ORIGIN=http://localhost:5173
```

Create a `.env` file in the `client` directory:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Running the Application

1. **Start the server**

```bash
cd server
node index.js
```

2. **Start the client** (in a new terminal)

```bash
cd client
npm run dev
```

3. **Access the application**

- Landing page: `http://localhost:5173`
- Customer chat: `http://localhost:5173/customer`
- Agent workspace: `http://localhost:5173/agent`

## How It Works

1. Customer sends a message in their native language (e.g., Spanish)
2. System detects the language and translates it to the agent's preferred language
3. Agent sees and responds in their own language (e.g., English)
4. System translates the reply back to the customer's language
5. Customer receives the response in Spanish

All translation happens automatically in the background.

## Project Structure

```
multilingual-support-chat/
├── server/
│   ├── routes/
│   │   └── conversations.js
│   ├── utils/
│   │   └── conversationManager.js
│   └── index.js
├── client/
│   └── src/
│       ├── agent/
│       │   ├── Inbox.jsx
│       │   ├── Conversation.jsx
│       │   └── ReplyBox.jsx
│       ├── customer/
│       │   └── CustomerChat.jsx
│       ├── utils/
│       │   └── LanguageSelector.jsx
│       ├── api.js
│       └── App.jsx
└── README.md
```

## API Endpoints

- `GET /api/conversations` - Get all conversations
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations/new` - Start new conversation
- `POST /api/conversations/:id/reply` - Agent sends reply
- `POST /api/conversations/:id/resolve` - Mark conversation as resolved
- `POST /api/conversations/:id/escalate` - Escalate conversation
- `POST /api/conversations/:id/end-customer` - Customer ends conversation
- `POST /api/messages` - Customer sends message

## WebSocket Events

**Agent Events:**

- `agent_join` - Agent connects with language preference
- `new_message` - New customer message received
- `conversation_updated` - Conversation list updated

**Customer Events:**

- `customer_join` - Customer connects to chat
- `agent_reply` - Agent reply received
- `conversation_ended` - Conversation closed
- `conversation_escalated` - Conversation escalated

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Translation powered by [Lingo.dev](https://lingo.dev)
