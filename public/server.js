var TriviaBoxServer = {};

var VOICE = "US English Female";
var WELCOME_TEXT = "Welcome to Trivia Box. \
In this game, I will read the questions and answers to you, so \
you'll want to listen carefully. Answer questions by tapping the answer \
on your phone. When you're ready, tap the start button to begin.";
var NEXT_QUESTION_MSG = "Let's move on...";
var CORRECT_ANSWER_MSG = "Correct answer. Good job!";
var WRONG_ANSWER_MSG = "Wrong answer. The correct answer is. ";
var EXIT_MSG = "Game ended. Goodbye.";

var letters = ["A","B","C","D"];

var started = false;
var questions;
var tries = 0;
var currentQuestion = 0;
var usedQuestions = [];
//var currentNum = 0;
var currentQuestionIndex = -1;
var currentCorrectAnswerLetter;
var currentCorrectAnswerText;
var currentQuestionDone = false;
var answerKeysArray;

// user stats
var correctAnswers = 0;

var database = firebase.database();

database.ref().update({ 'data/started': false });

database.ref('questions').once('value').then(function(snapshot) {
  questions = snapshot.val();
  init();
});

database.ref('data/rebootServer').on('value', function(snapshot) {
  if(snapshot.val() == true) {
    database.ref().update({ 'data/rebootServer': false }).then(function() {
      location.reload();
    });
  }
});

database.ref('data/started').on('value', function(snapshot) {
  if(snapshot.val() == true)
    start();
  else
    end();
});

database.ref('data/next').on('value', function(snapshot) {
  if(snapshot.val() == true) {
    nextQuestion();
    database.ref().update({ 'data/next': false });
  }
});

database.ref('data/repeatLast').on('value', function(snapshot) {
  if(snapshot.val() == true) {
    repeatQuestion();
  }
});

database.ref('data/answer').on('value', function(snapshot) {
  var val = snapshot.val();
  if(val != null) {
    chooseAnswer(val);
  }
  else {
    removeAnswerFromFirebase();
  }
});

function removeAnswerFromFirebase() {
  database.ref().update({ 'data/answer': null });
}

function repeatDone() {
  database.ref().update({ 'data/repeatLast': false });
}

function speak(text, options, voice) {
  voice = voice || null;
  var defaultOptions = {
    volume: 1,
    pitch: 1,
    rate: 0.9
  };
  options = Object.assign(defaultOptions, options);
  responsiveVoice.speak(text, voice, options);
  $('#speaks').append('<div>'+text+'</div>');
}

function init() {
  if(started)
    return;
  console.log("Init Game");
  setTimeout(function() {
    responsiveVoice.setDefaultVoice(VOICE);
    speak(WELCOME_TEXT);
  },205);
  removeAnswerFromFirebase();
}

function start() {
  console.log("Starting Game");
  nextQuestion();
  started = true;
}

function end() {
  if(!started)
    return;
  console.log("Ending Game");
  currentQuestionIndex = -1;
  //currentNum = 0;
  speak(EXIT_MSG);
  started = false;
  database.ref().update({ 'data/started': false, 'data/results': null });
}

function rand(end) {
  return Math.floor(Math.random() * end);
}

function nextQuestion() {
  removeAnswerFromFirebase();
  currentQuestionIndex++;
  if(currentQuestionIndex >= questions.length) {
    results();
    return;
  }
  answerKeysArray = $.map(questions[currentQuestionIndex].answers, function (value, key) { return key; });
  answerKeysArray = shuffle(answerKeysArray);
  //currentNum++;
  database.ref().update({ 'data/currentQuestion': currentQuestionIndex+1 });
  speakQuestion(currentQuestionIndex);

}

function results() {
  var percentage = Math.round((correctAnswers / questions.length) * 100);
  var results = {
    'percentage': percentage,
    'correct': correctAnswers + " out of " + questions.length
  };
  var sentence = "That's it! ";
  sentence += "Overall, you got " + results.correct + " questions correct, which is "+results.percentage + "%.";

  if(percentage > 80)
    sentence += "Great job!";
  else if(percentage > 80)
    sentence += "Good job!";
  else if(percentage > 55)
    sentence += "Alright, but you could've done better.";
  else
    sentence += "Maybe you'll do better next time.";

  speak(sentence, { onend: end });
  database.ref().update({ 'data/results': results });

}

function speakQuestion(number) {
  currentQuestionIndex = number;
  var q = questions[number];
  if(!q)
    return;
  var text = "Question #" + (currentQuestionIndex+1) + ". " + q.question + " ";
  for(var i = 0; i < answerKeysArray.length; i++) {
    text += letters[i] + ". " + q.answers[answerKeysArray[i]] + ". ";
    // if index is zero, it's the right answer...
    // (they are randomized)
    if(answerKeysArray[i] == 0) {
      currentCorrectAnswerText = letters[i] + ". " + q.answers[0];
      currentCorrectAnswerLetter = letters[i];
    }
  }
  speak(text, { onend: speakingDone });
}

function speakingDone() {
  repeatDone();
}

function repeatQuestion(question) {
  speakQuestion(currentQuestionIndex);
}

function chooseAnswer(answer) {
  if(answer != currentCorrectAnswerLetter)
    wrongAnswer();
  else
    correctAnswer();
}

function correctAnswer() {
  speak(CORRECT_ANSWER_MSG, {onend: nextQuestion});
  correctAnswers++;
}

function wrongAnswer() {
  speak(WRONG_ANSWER_MSG + currentCorrectAnswerText,
    {onend: nextQuestion});
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}
