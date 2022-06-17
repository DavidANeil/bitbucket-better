const loggedInText = document.querySelector('.aui-avatar-inner img').alt;
const userName = loggedInText.match(/Logged in as ([\w ]+) \((\w+)\)/)[2];
