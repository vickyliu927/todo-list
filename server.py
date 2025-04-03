from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import openai
import os
from datetime import datetime
import random

# Load environment variables from .env
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Initialize Flask app
app = Flask(__name__)
app.static_folder = os.path.abspath(os.path.dirname(__file__))

# Configure CORS
allowed_origins = [
    "http://localhost:8000",  # Local development
    "https://todo-list-frontend.onrender.com",  # Your frontend URL on Render
    "https://vickyliu927.github.io"  # Your GitHub Pages URL
]
CORS(app, resources={
    r"/*": {
        "origins": allowed_origins,
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Local fallback summary function
def generate_local_summary(todos, category, completed_tasks, high_priority, medium_priority, low_priority, overdue_tasks):
    templates = {
        'empty': [
            "Empty {category} list? Living your best procrastinator life! 🌟",
            "Nothing in {category}? Either super productive or expert avoider! 😎",
            "{category} looking empty... Netflix marathon? 🍿"
        ],
        'all_complete': [
            "Crushed {completed_count} tasks! Who are you and what's your secret? 🏆",
            "Look who finished everything! Main character energy right here! ✨",
            "{completed_count} tasks done! Productivity level: legendary 🚀"
        ],
        'high_priority': [
            "Umm... {high_priority_task} is giving you the side-eye! 👀",
            "Maybe {high_priority_task} should be your priority? Just saying! 💁‍♂️",
            "Plot twist: {high_priority_task} won't do itself! 🎬"
        ],
        'overdue': [
            "Those {overdue_count} overdue tasks aren't aging like fine wine! ⏰",
            "Time management isn't your love language, huh? {overdue_count} overdue! 📅",
            "Deadlines? More like suggestions, right? ({overdue_count} overdue) 🤷‍♂️"
        ],
        'mixed': [
            "{done_count} done, {todo_count} to go! The grind continues! 💪",
            "Knocked out {done_count}, but {todo_count} more want attention! 🎯",
            "Progress check: {done_count} down, {todo_count} living rent-free in your mind! 🏠"
        ]
    }

    if not todos:
        return random.choice(templates['empty']).format(category=category)
    if overdue_tasks:
        return random.choice(templates['overdue']).format(overdue_count=len(overdue_tasks))
    if high_priority:
        return random.choice(templates['high_priority']).format(high_priority_task=high_priority[0])
    if len(completed_tasks) == len(todos):
        return random.choice(templates['all_complete']).format(completed_count=len(completed_tasks))

    return random.choice(templates['mixed']).format(
        done_count=len(completed_tasks),
        todo_count=len(todos) - len(completed_tasks)
    )

@app.route('/api/generate-summary', methods=['POST'])
def generate_summary():
    try:
        data = request.json
        todos = data.get('todos', [])
        category = data.get('category', 'General')

        completed_tasks = [task['text'] for task in todos if task['completed']]
        incomplete_tasks = [task for task in todos if not task['completed']]
        high_priority = [task['text'] for task in incomplete_tasks if task['priority'] == 'high']
        medium_priority = [task['text'] for task in incomplete_tasks if task['priority'] == 'medium']
        low_priority = [task['text'] for task in incomplete_tasks if task['priority'] == 'low']

        now = datetime.now()
        overdue_tasks = [
            task['text'] for task in incomplete_tasks 
            if task.get('dueDate') and datetime.fromisoformat(task['dueDate'].replace('Z', '+00:00')) < now
        ]

        system_prompt = """You are a witty AI todo list assistant with a Gen-Z sense of humor. 
        Your job is to create short, sarcastic summaries that are both funny and motivating.
        You love using modern slang, internet humor, and relevant emojis.
        Keep responses under 20 words and reference specific tasks when possible."""

        user_prompt = f"""Category: {category}
Tasks Overview:
✓ Completed: {', '.join(completed_tasks) if completed_tasks else 'None'}
⚠ High Priority: {', '.join(high_priority) if high_priority else 'None'}
📝 Medium Priority: {', '.join(medium_priority) if medium_priority else 'None'}
💭 Low Priority: {', '.join(low_priority) if low_priority else 'None'}
⏰ Overdue: {', '.join(overdue_tasks) if overdue_tasks else 'None'}

Requirements:
- Be playfully sarcastic (but encouraging)
- Reference specific tasks
- Use modern internet humor
- Include emojis
- Max 20 words
- Mention high priority/overdue tasks if any exist
- Be encouraging about completed tasks"""

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=60,
            temperature=0.8,
            presence_penalty=0.6,
            frequency_penalty=0.4,
            top_p=0.9
        )

        summary = response.choices[0].message["content"].strip()
        print(f"Generated summary: {summary}")
        return jsonify({"summary": summary})

    except Exception as e:
        print(f"Error in generate_summary: {str(e)}")
        fallback = generate_local_summary(todos, category, completed_tasks, high_priority, medium_priority, low_priority, overdue_tasks)
        return jsonify({"summary": fallback, "error": str(e)}), 500

@app.route('/')
def root():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
