// Data fetching hooks for Wooking for Work
(function() {
const { useState, useEffect, useCallback } = React;

function useJobs(filters = {}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.API.jobsApi.list(filters);
      setJobs(data.jobs);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);
  
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);
  
  const updateJob = useCallback(async (id, updates) => {
    try {
      const data = await window.API.jobsApi.update(id, updates);
      setJobs(prev => prev.map(j => j.id === id ? data.job : j));
      return data.job;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);
  
  const deleteJob = useCallback(async (id) => {
    try {
      await window.API.jobsApi.delete(id);
      setJobs(prev => prev.filter(j => j.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);
  
  const moveJob = useCallback(async (id, newState) => {
    return updateJob(id, { state: newState });
  }, [updateJob]);
  
  return {
    jobs,
    setJobs,
    loading,
    error,
    refetch: fetchJobs,
    updateJob,
    deleteJob,
    moveJob,
  };
}

function useActivities(filters = {}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.API.activitiesApi.list(filters);
      setActivities(data.activities);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch activities:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);
  
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);
  
  const createActivity = useCallback(async (activity) => {
    try {
      const data = await window.API.activitiesApi.create(activity);
      setActivities(prev => [...prev, data.activity]);
      return data.activity;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);
  
  return {
    activities,
    loading,
    error,
    refetch: fetchActivities,
    createActivity,
  };
}

function useRuns(filters = {}) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.API.runsApi.list(filters);
      setRuns(data.runs);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch runs:', err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);
  
  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);
  
  const createRun = useCallback(async (run) => {
    try {
      const data = await window.API.runsApi.create(run);
      setRuns(prev => [...prev, data.run]);
      return data.run;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);
  
  const updateRun = useCallback(async (id, updates) => {
    try {
      const data = await window.API.runsApi.update(id, updates);
      setRuns(prev => prev.map(r => r.id === id ? data.run : r));
      return data.run;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);
  
  return {
    runs,
    loading,
    error,
    refetch: fetchRuns,
    createRun,
    updateRun,
  };
}

function useStatic() {
  const [states, setStates] = useState([]);
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchStatic = async () => {
      setLoading(true);
      try {
        const [statesData, commandsData] = await Promise.all([
          window.API.staticApi.getStates(),
          window.API.staticApi.getCommands(),
        ]);
        setStates(statesData.states);
        setCommands(commandsData.commands);
      } catch (err) {
        setError(err.message);
        console.error('Failed to fetch static data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatic();
  }, []);
  
  return { states, commands, loading, error };
}

// Export hooks to window for global access
Object.assign(window, { useJobs, useActivities, useRuns, useStatic });
})();
