//post a job
app.post('/post-job', async(req,res) =>{
    const body = req.body;
    console.log(body)
    body.createAt = new Date();
    const result = await jobsCollections.insertOne(body);
    if(result){
        return res.status(200).send(result);
    }
    else{
        return res.status(404).send({
            message : "can not insert! try again later",
            status : false
        })
    }
})

//get all jobs
app.get("/all-jobs", async(req, res) =>{
    const jobs = await jobsCollections.find().toArray();
    res.send(jobs);
})
