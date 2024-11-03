const API_ENDPOINT = "/api/generate-story";
const ERROR_GEN_STORY = "Error generating story";
const ERROR_GEN_STORY_TWO = "An error occurred while generating the story.";
class Dashboard {
    constructor(data) {
        this.init();
        this.userData = data;
    }

    init() {
        this.loadDashboard();
    }

    loadDashboard() {
        document.getElementById("index_form").onsubmit = async (event) => {
            // Dont re-fresh page
            event.preventDefault(); 

            // Get the prompt given by the user
            const prompt = document.getElementById("prompt").value;

            try {
            // Fetch the story
            await this.fetchStory(prompt)
                .then(
                    (data) => {

                    // Append story to the localPage
                    // stories is now a json

                    // let jsonStory = 
                    // {
                    //     0: []
                    // }
                    // Use this for Milestone 2, linked list
                    // var count = Object.keys(jsonStory).length;
                    // jsonStory[count] = [data.generatedStoryPart];

                    let storyArray = localStorage.getItem("data");

                    // This is just used for planning for the Milestone 2.
                    if (storyArray == null) {
                        storyArray = JSON.stringify({
                            0: {
                                stories: [],
                                promptOptions: []
                            }
                        });
                    }

                    let jsonData = JSON.parse(storyArray);
                    jsonData[0].stories.push(data.generatedStoryPart);
                    jsonData[0].promptOptions.push(data.promptOptions);
                    localStorage.setItem("data", JSON.stringify(jsonData));
                    // Temporarily set current page to 1
                    localStorage.setItem("currentPageNumber", "1");

                    // Redirect to the story page
                    window.location.href = "story.html";
                }
                ,
                (error) => { alert(error); }
            )
            } catch (error) {
                console.error(error);
                alert(ERROR_GEN_STORY_TWO);
            }
        }
    }

    async fetchStory(prompt) {
        return new Promise(async (res, rej) => {
            const response = await fetch(`${API_URL}${API_ENDPOINT}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    prompt : prompt,
                    userId: this.userData.user._id
                })
            });
            if (response.ok)
                res(await response.json());
            else
                rej(ERROR_GEN_STORY);
        });
    }
}

export {Dashboard};