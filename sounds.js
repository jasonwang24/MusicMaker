(function() {

  var notes_played = [];
  var recent_recording = null;
  var playbackEvents = null;
  var isRecording = false;
  var seconds_passed = 0;
  var update;
  var firstSound = "1";
  var intervals = {};
  var pressed = {};
  var keyLength = 12;

  var keys = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-",
    "q", "w", "e", "r", "t", "y", "u", "i", "o", "p",
    "a", "s", "d", "f", "g", "h", "j", "k", "l",
    "z", "x", "c", "v", "b", "n", "m"
  ];

  var codes = [
    49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 189,
    81, 87, 69, 82, 84, 89, 85, 73, 79, 80,
    65, 83, 68, 70, 71, 72, 74, 75, 76,
    90, 88, 67, 86, 66, 78, 77
  ];

  function updateTimer() {
    var minutes, seconds;
    if (isRecording) {
      seconds_passed++;
      minutes = Math.floor(seconds_passed / 60);
      seconds = seconds_passed % 60;
      if (seconds < 10) {
        seconds = "0" + seconds;
      }
      document.getElementById("display").innerHTML = minutes + ":" + seconds;
    }
  }

  function record_toggle() {
    if (isRecording) { // stop recording
      recent_recording = events_to_string(notes_played);

      song_id = make_id(keyLength);
      console.log(song_id);

      let data = {
        "song_id": song_id,
        "song_string": recent_recording
      };

      fetch("https://qaz5znc10i.execute-api.us-east-1.amazonaws.com/live/putsong", {
        method: "POST",
        body: JSON.stringify(data)
      }).then(res => {
        res.json().then(function(data) {
          console.log(data);
        });
      });

      document.getElementById("display").innerHTML = "The id for your song is: " + song_id;

      $("#display").show();
      document.getElementById("record-button").innerHTML = "Continue Recording";
      document.getElementById("playback-recorded-button").disabled = false;
      clearInterval(update);
      seconds_passed = 0;
    } else {
      update = setInterval(updateTimer, 1000);
      document.getElementById("record-button").innerHTML = "Stop Recording";
      document.getElementById("playback-recorded-button").disabled = true;
    }
    isRecording = !isRecording;
  }

  function play_note(event) {
    if (event["type"] == "mousedown") {
      $(soundClass(event["sound"])).mousedown();
    } else if (event["type"] == "mouseup") {
      $(soundClass(event["sound"])).mouseup();
    } else {
      var press = $.Event(event["type"]);
      press.keyCode = event["code"];
      press.which = event["code"];
      $(document).trigger(press);
    }
  }

  function playback(events_array) {
    var index = 0;
    var diff;

    function play_one() {
      if (index >= events_array.length) {
        if (recent_recording != null) {
          setTimeout(function() {
            document.getElementById("playback-recorded-button").disabled = false;
          }, 750);
        }
        return;
      }
      play_note(events_array[index]);
      diff = events_array[index]["difference"];
      index++;
      setTimeout(play_one, diff);
    }
    if (recent_recording != null) {
      document.getElementById("playback-recorded-button").disabled = true;
    }
    play_one();
  }

  $(document).ready(function() {
    $("#toggle-display-button").click(function() {
      $("#recording-playback-container").slideToggle();
      $(this).text($(this).text() == "Hide Options" ? "Show Options" : "Hide Options");
    });

    $("#record-button").click(function() {
      record_toggle();
    });

    $("#playback-recorded-button").click(function() {
      var events = string_to_events(recent_recording);
      console.log(events);

      playback(events);
    })

    $("#idForm").submit(function(event) {

      let data = {
        "song_id": $("#fname").first().val()
      };

      fetch("https://qaz5znc10i.execute-api.us-east-1.amazonaws.com/live/getsong", {
        method: "POST",
        body: JSON.stringify(data)
      }).then(res => {
        res.json().then(function(data) {
          playbackEvents = string_to_events(JSON.stringify(Object.values(data)[0]).replace(/"/g, ""));
          try {
            document.getElementById("display").innerHTML = "&nbsp";
            playback(playbackEvents);
          } catch (err) {
            document.getElementById("display").innerHTML = "Invalid key!";
          }

        });
      });

      event.preventDefault();
    })

    document.getElementById("playback-recorded-button").disabled = true;
  });

  function make_id(num_chars) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < num_chars; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
  }

  /* Selectors */
  function soundClass(name) {
    return "." + name;
  };

  function soundId(id) {
    return id;
  };

  function sound(id) {
    var it = document.getElementById(soundId(id));
    return it;
  };

  /* Virtual keyboard events. */
  function keyup(code) {
    var offset = codes.indexOf(code);
    var k;
    if (offset >= 0) {
      k = keys.indexOf(firstSound) + offset;
      return keys[k];
    }
  };

  function keydown(code) {
    return keyup(code);
  };

  function press(key) {
    var audio = sound(key);
    if (pressed[key]) {
      return;
    }
    clearInterval(intervals[key]);
    if (audio) {
      audio.pause();
      audio.volume = 1.0;
      if (audio.readyState >= 2) {
        audio.currentTime = 0;
        audio.play();
        pressed[key] = true;
      }
    }
    $(soundClass(key)).animate({
      "backgroundColor": "#808080",
      "top": "5px"
    }, 0);

  };

  function kill(key) {
    var audio = sound(key);
    return function() {
      clearInterval(intervals[key]);
      if (audio) {
        audio.pause();
      }
      $(soundClass(key)).animate({
        "backgroundColor": "black",
        "top": "0px"
      }, 0, function() {
        $(this).removeAttr('style');
      });
    };
  };

  keys.forEach(function(key) {
    $(soundClass(key)).mousedown(function() {
      $(soundClass(key)).animate({
        "backgroundColor": "#0E4D92"
      }, 0);
      press(key);
    });

    $(soundClass(key)).mouseup(function() {
      pressed[key] = false;
      kill(key)();
    });
  });

  $(document).keydown(function(event) {
    press(keydown(event.which));
  });

  $(document).keyup(function(event) {
    if (keyup(event.which)) {
      pressed[keyup(event.which)] = false;
      kill(keyup(event.which))();

    }
  });

  keys.forEach(function(key) {
    $(soundClass(key)).on("mousedown mouseup", function(event) {
      if (isRecording) {
        notes_played.push({
          "timeStamp": event.timeStamp,
          "type": event.type,
          "sound": key
        });
      }
    });
  });

  $(document).on("keyup keydown", function(event) {
    if (isRecording) {
      notes_played.push({
        "timeStamp": event.timeStamp,
        "type": event.type,
        "code": event.which
      });
    }
  });

  var action_to_num = {
    "mousedown": 0,
    "mouseup": 1,
    "keyup": 2,
    "keydown": 3
  }

  var num_to_action = {
    0: "mousedown",
    1: "mouseup",
    2: "keyup",
    3: "keydown"
  }

  function events_to_string(events) {
    var single_event, difference, code, event_num;
    var string = "";

    for (var i = 0; i < events.length; i++) {
      single_event = events[i];
      if (i == events.length - 1) {
        difference = 0;
      } else {
        difference = Math.floor(events[i + 1]["timeStamp"] - single_event["timeStamp"]);
      }

      event_num = action_to_num[single_event["type"]];
      if (event_num < 2) {
        // mouseclicks
        code = single_event["sound"];
      } else {
        // press keys
        code = single_event["code"];
      }
      string += [event_num, code, difference].join(".");
      if (i < events.length - 1) {
        string += "_";
      }
    };
    return string;
  }

  function string_to_events(events_string) {
    var ret = [];
    var items;
    var events_split = events_string.split("_");
    for (var i = 0; i < events_split.length; i++) {
      items = events_split[i].split(".")
      if (items[0] < 2) {

        ret.push({
          "type": num_to_action[items[0]],
          "sound": items[1],
          "difference": items[2]
        });
      } else {

        ret.push({
          "type": num_to_action[items[0]],
          "code": parseInt(items[1], 10),
          "difference": parseInt(items[2], 10)
        });
      }
    };
    return ret;
  }

})();