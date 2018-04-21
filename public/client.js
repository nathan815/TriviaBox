var db = firebase.database();

db.ref('data/started').on('value', function(snapshot) {
  if(snapshot.val() == true)
    start();
  else
    restart();
});

db.ref('data/results').on('value', function(snapshot) {
  if(snapshot.val() != null) {
    $('#questionBtns,#start').hide();
    $('#results').show();
    $('#result_percent').text("Result: " + snapshot.val().percentage + "%");
    $('#result_num').text(snapshot.val().correct + " correct.");
  }
  else {
    $('#results').hide();
  }
});

db.ref('data/currentQuestion').on('value', function(snapshot) {
  $('#questionNum').text(snapshot.val());
});

db.ref('data/repeatLast').on('value', function(snapshot) {
  $('#repeat').prop('disabled', snapshot.val());
});

db.ref('data/answer').on('value', function(snapshot) {
  if(snapshot.val() != null) {
    $('.answer, #repeat').prop('disabled',true);
  }
  else {
    $('.answer, #repeat').prop('disabled',false);
  }
});

function chooseAnswer() {
  var letter = $(this).val();
  db.ref().update({ 'data/answer': letter });
}

function repeatQuestion() {
  db.ref().update({ 'data/repeatLast': true });
}

function restart() {
  $('#start').show();
  $('#questionBtns').hide();
}

function start() {
  $('#start').hide();
  $('#questionBtns').show();
  db.ref().update({ 'data/started': true });
}

function end() {
  db.ref().update({ 'data/started': false });
}

function reboot() {
  if(confirm("Really restart server?"))
    db.ref().update({ 'data/rebootServer': true });
}

$(function() {
  $('#start').click(start);
  $('.answer').click(chooseAnswer);
  $('#repeat').click(repeatQuestion);
  $('#end').click(end);
  $('#reboot').click(reboot);
});
