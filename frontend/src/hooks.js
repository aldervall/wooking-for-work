import { useState, useEffect, useCallback } from 'react';
import { jobsApi, activitiesApi, runsApi, staticApi, profileApi } from './api';

export function useJobs(filters = {}) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await jobsApi.list(filters);
      setJobs(data.jobs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const updateJob = useCallback(async (id, updates) => {
    const data = await jobsApi.update(id, updates);
    setJobs(prev => prev.map(j => j.id === id ? data.job : j));
    return data.job;
  }, []);

  const deleteJob = useCallback(async (id) => {
    await jobsApi.delete(id);
    setJobs(prev => prev.filter(j => j.id !== id));
  }, []);

  const moveJob = useCallback(async (id, newState) => {
    return updateJob(id, { state: newState });
  }, [updateJob]);

  return { jobs, setJobs, loading, error, refetch: fetchJobs, updateJob, deleteJob, moveJob };
}

export function useActivities(filters = {}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await activitiesApi.list(filters);
      setActivities(data.activities);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const createActivity = useCallback(async (activity) => {
    const data = await activitiesApi.create(activity);
    setActivities(prev => [...prev, data.activity]);
    return data.activity;
  }, []);

  return { activities, loading, error, refetch: fetchActivities, createActivity };
}

export function useRuns(filters = {}) {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runsApi.list(filters);
      setRuns(data.runs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchRuns(); }, [fetchRuns]);

  const createRun = useCallback(async (run) => {
    const data = await runsApi.create(run);
    setRuns(prev => [...prev, data.run]);
    return data.run;
  }, []);

  const updateRun = useCallback(async (id, updates) => {
    const data = await runsApi.update(id, updates);
    setRuns(prev => prev.map(r => r.id === id ? data.run : r));
    return data.run;
  }, []);

  return { runs, loading, error, refetch: fetchRuns, createRun, updateRun };
}

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileApi.get();
      setProfile(data.profile);
      return data.profile;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateProfile = useCallback(async (updates) => {
    const data = await profileApi.update(updates);
    setProfile(data.profile);
    return data.profile;
  }, []);

  const importLinkedIn = useCallback(async (url) => {
    const data = await profileApi.importLinkedIn(url);
    setProfile(data.profile);
    return data.profile;
  }, []);

  const resetProfile = useCallback(async () => {
    await profileApi.delete();
    setProfile(null);
  }, []);

  return { profile, loading, error, refetch: fetchProfile, updateProfile, importLinkedIn, resetProfile };
}

export function useStatic() {
  const [states, setStates] = useState([]);
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStatic = async () => {
      setLoading(true);
      try {
        const [statesData, commandsData] = await Promise.all([
          staticApi.getStates(),
          staticApi.getCommands(),
        ]);
        setStates(statesData.states);
        setCommands(commandsData.commands);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStatic();
  }, []);

  return { states, commands, loading, error };
}
