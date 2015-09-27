Characters = new Mongo.Collection("characters");

if (Meteor.isClient) {
    // This code only runs on the client
    Template.body.helpers({
        characters: function () {
            if (Session.get("hideCompleted")) {
                // If hide completed is checked, filter characters
                return Characters.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
            } else {
                // Otherwise, return all of the characters
                return Characters.find({}, {sort: {createdAt: -1}});
            }
        },
        hideCompleted: function () {
            return Session.get("hideCompleted");
        },
        incompleteCount: function () {
            return Characters.find({checked: {$ne: true}}).count();
        },
    });

    Template.body.events({
        "submit .new-character": function(event) {
            // Prevent default browser form submit
            event.preventDefault();
            // Get value from form element
            var name = event.target.text.value;
            // Insert a character into the collection
            Characters.insert({
                text: "Write here.",
                name: name,
                createdAt: new Date(),            // current time
                owner: Meteor.userId(),           // _id of logged in user
                username: Meteor.user().username  // username of logged in user
            });
            // Clear form
            event.target.text.value = "";
        },
        "change .hide-completed input": function (event) {
            Session.set("hideCompleted", event.target.checked);
        },
    });

    var toggleEdit = function (location, textBox) {
        // Set the checked property to the opposite of its current value
        if (location.editMode) {
            Characters.update(location._id, {
                $set: {
                    text: textBox.innerHTML
                       .replace(/<br(\s*)\/*>/ig, '\n') // replace single line-breaks
                       .replace(/<[p|div]\s/ig, '\n$0') // add a line break before all div and p tags
                       .replace(/(<([^>]+)>)/ig, ""),   // remove any remaining tags,
                }
            });
            textBox.focus(); // Should enter edit mode.
        }
        Characters.update(location._id, {
            $set: {
                editMode: ! location.editMode,
            }
        });
    }

    Template.character.events({
        "click .edit": function (event) {
            // The actual text box is a niece of the button.
            toggleEdit(this, event.target.nextElementSibling.firstElementChild.nextElementSibling);
        },
        "click .delete": function () {
            Characters.remove(this._id);
        },
        "keydown .character-edit": function (event) {
            // ESC or ENTER
            if (event.which === 27 || (event.which === 13 && event.shiftKey)) {
                event.preventDefault();
                event.target.blur();
                toggleEdit(this, event.target);
            }
        }
    });

    Template.character.helpers({
        markdown_raw: function () {
            var markedUp = hljs.highlight("markdown", this.text).value;
            return Spacebars.SafeString(markedUp.replace(/\n/g, "<br>")).string;
        },
    });


    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY"
    });
}
