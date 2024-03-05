import React, { useEffect,useState } from 'react'

const MyJobs = () => {
    const email = "milind@gmail.com"
    const [jobs, setJobs] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(()=>{
        setIsLoading(true)
        fetch(`https://job-quest.onrender.com/myJobs/milind@gmail.com`)
            .then((res) => res.json())
            .then((data) =>{
            setJobs(data);
        });
    },[]);

    const handleSearch = () => {
        const filter= jobs.filter((job) => job.jobTitle.toLowerCase().indexOf(searchText.toLowerCase()) !== -1);
        setJobs(filter);
        setIsLoading(false);
    }

  return (
    <div className='max-w-screen-2xl container mx-auto x1:px-24 px-4'>
        <div className='my-jobs-container'>
            <h1 className='text-center p-4'>All My Jobs</h1>
            <div className='search-box p-2 text-center mb-2'>
                <input
                onChange={(e) => setSearchText(e.target.value)}
                type="text" name='search' id='search' className='py-2 pl-3 border focus:outline:none lg:w-6/12 mb:4 w-full'/>
                <button className='bg-blue text-white font-semibold px-8 py-2 rounded-sm mb-4' onClick={handleSearch}>Search</button>
            </div>
        </div>

        {/* table */}
        <section className='py-1 bg-blue'>
            <div className='w-'>

            </div>
        </section>
    </div>
  )
}

export default MyJobs