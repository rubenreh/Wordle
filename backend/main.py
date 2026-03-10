 # Author: Ruben Rehal
# Date: 03/08/2026


import uuid
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from words import get_random_target, is_valid_word

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Pydantic models ----

class CreateGameRequest(BaseModel):
    word_length: int = Field(ge=5, le=8)

class GuessRequest(BaseModel):
    guess: str

class LetterFeedback(BaseModel):
    letter: str
    result: str  # "green", "yellow", or "gray"

class GuessResult(BaseModel):
    word: str
    feedback: list[LetterFeedback]

class GameState(BaseModel):
    game_id: str
    word_length: int
    max_guesses: int
    guesses: list[GuessResult]
    status: str  # "in_progress", "won", or "lost"
    answer: Optional[str] = None  # only shown when the game is over


# ---- In-memory game storage ----
# Each entry stores the full game info including the secret answer
games: dict = {}


def compute_feedback(guess: str, answer: str) -> list[LetterFeedback]:
    """
    Compare the guess against the answer and return per-letter feedback.
    
    Green = right letter, right spot
    Yellow = right letter, wrong spot
    Gray = letter not in the word (or already accounted for)
    
    We need two passes to handle duplicate letters properly.
    """
    length = len(answer)
    result = ["gray"] * length
    answer_chars = list(answer)
    used = [False] * length

    # first pass: find exact matches (green)
    for i in range(length):
        if guess[i] == answer_chars[i]:
            result[i] = "green"
            used[i] = True

    # second pass: find wrong-position matches (yellow)
    for i in range(length):
        if result[i] == "green":
            continue
        for j in range(length):
            if not used[j] and guess[i] == answer_chars[j]:
                result[i] = "yellow"
                used[j] = True
                break

    feedback = []
    for i in range(length):
        feedback.append(LetterFeedback(letter=guess[i], result=result[i]))
    return feedback


def build_game_response(game_data: dict) -> GameState:
    """Build the response object for a game, hiding the answer if still playing."""
    show_answer = game_data["status"] != "in_progress"
    return GameState(
        game_id=game_data["game_id"],
        word_length=game_data["word_length"],
        max_guesses=game_data["max_guesses"],
        guesses=game_data["guesses"],
        status=game_data["status"],
        answer=game_data["answer"] if show_answer else None,
    )


# ---- Routes ----

@app.get("/")
def read_root():
    return {"message": "Wordle API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.post("/games", response_model=GameState)
def create_game(req: CreateGameRequest):
    game_id = str(uuid.uuid4())
    answer = get_random_target(req.word_length)

    game_data = {
        "game_id": game_id,
        "word_length": req.word_length,
        "max_guesses": req.word_length + 1,
        "guesses": [],
        "status": "in_progress",
        "answer": answer,
    }
    games[game_id] = game_data

    return build_game_response(game_data)


@app.get("/games/{game_id}", response_model=GameState)
def get_game(game_id: str):
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")
    return build_game_response(games[game_id])


@app.post("/games/{game_id}/guesses", response_model=GameState)
def submit_guess(game_id: str, req: GuessRequest):
    if game_id not in games:
        raise HTTPException(status_code=404, detail="Game not found")

    game_data = games[game_id]

    if game_data["status"] != "in_progress":
        raise HTTPException(status_code=400, detail="Game is already over")

    guess = req.guess.lower().strip()

    # make sure the guess is the right length
    if len(guess) != game_data["word_length"]:
        raise HTTPException(
            status_code=400,
            detail=f"Guess must be {game_data['word_length']} letters"
        )

    # check that it's actually a real word
    if not is_valid_word(guess, game_data["word_length"]):
        raise HTTPException(status_code=400, detail="Not a valid word")

    # compute the letter-by-letter feedback
    feedback = compute_feedback(guess, game_data["answer"])
    game_data["guesses"].append(GuessResult(word=guess, feedback=feedback))

    # check if they got it right
    if guess == game_data["answer"]:
        game_data["status"] = "won"
    elif len(game_data["guesses"]) >= game_data["max_guesses"]:
        game_data["status"] = "lost"

    return build_game_response(game_data)
