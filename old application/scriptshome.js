console.log(`Basic Testing for Home Page`);

//  Display your notes here

const audio = document.getElementById("audioclip");

audio.addEventListener('playing', (event) => {
    console.log("They clicked play!!");
});

audio.addEventListener('pause', (event) => {
    console.log("They clicked pause");
});