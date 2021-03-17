// send request to this form
// https://docs.google.com/forms/d/e/1FAIpQLSfVvMVxU5eKKaEzERBSxaeIZmnA8bNM1Ew3riQJHzbASEZdQg

$('#google-form').submit(function(form) {
    //prevent the form from submitting so we can post to the google form
    form.preventDefault();

    //AJAX request
    $.ajax({
        url: 'https://docs.google.com/forms/d/e/1FAIpQLSfVvMVxU5eKKaEzERBSxaeIZmnA8bNM1Ew3riQJHzbASEZdQg/formResponse',     //The public Google Form url, but replace /view with /formResponse
        data: $('#google-form').serialize(), //Nifty jquery function that gets all the input data
        type: 'POST', //tells ajax to post the data to the url
        dataType: "json", //the standard data type for most ajax requests
        statusCode: {
            0: function(data) { //0 is when Google gives a CORS error, don't worry it went through
                //success
                alert("0 : sent")
            },
            200: function(data) {//200 is a success code. it went through!
                //success
                alert("200 : sent")
            },
            403: function(data) {//403 is when something went wrong and the submission didn't go through
                //error
                alert('Oh no! something went wrong. we should check our code to make sure everything matches with Google');
            }
        }
    });
});