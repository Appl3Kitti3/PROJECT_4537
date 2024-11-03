class Utils {
// Helped with Co-Pilot
    static cleanString(str)
    {
        // This is the pattern that we will only get from the AI response, nothing else
        let pattern = /[^a-zA-Z0-9 \" \' \, \. \-]/g;

        // Replace any character that does not contain this pattern with an empty string
        return str.replace(pattern, '');
    }
}