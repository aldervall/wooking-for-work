// Shared React Hooks for Wooking for Work
// Works with both legacy (window-based) and modern (ES modules) frontends

// Unified hooks that work in both environments
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
if (typeof window !== 'undefined' && window.React) {
  // Legacy environment - use global React
  const { useState, useEffect, useCallback, useMemo, useRef } = window.React;
}

// Jobs Hook
export function useJobs(filters = {}, enabled = true) {
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
    if (enabled) fetchJobs();
    else setLoading(false);
  }, [fetchJobs, enabled]);
  
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
    jobs, setJobs, loading, error, refetch: fetchJobs, updateJob, deleteJob, moveJob,
  };
}

// Activities Hook
export function useActivities(filters = {}, enabled = true) {
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
    if (enabled) fetchActivities();
    else setLoading(false);
  }, [fetchActivities, enabled]);
  
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
  
  return { activities, loading, error, refetch: fetchActivities, createActivity };
}

// Runs Hook
export function useRuns(filters = {}) {
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
  
  return { runs, loading, error, refetch: fetchRuns, createRun, updateRun };
}

// Static Data Hook (States & Commands)
export function useStatic(enabled = true) {
  const [states, setStates] = useState([]);
  const [commands, setCommands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
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
  }, [enabled]);
  
  return { states, commands, loading, error };
}

// Profile Hook
export function useProfile(enabled = true) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await window.API.profileApi.get();
      setProfile(data.profile);
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (enabled) fetchProfile();
    else setLoading(false);
  }, [fetchProfile, enabled]);
  
  const updateProfile = useCallback(async (updates) => {
    try {
      const data = await window.API.profileApi.update(updates);
      setProfile(data.profile);
      return data.profile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);
  
  const importLinkedIn = useCallback(async (url) => {
    try {
      const data = await window.API.profileApi.importLinkedIn(url);
      setProfile(data.profile);
      return data.profile;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);
  
  const resetProfile = useCallback(async () => {
    try {
      await updateProfile({ status: 'empty', linkedIn: null });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [updateProfile]);
  
  return {
    profile, loading, error, updateProfile, importLinkedIn, resetProfile, refetch: fetchProfile,
  };
}

// Tweaks Hook (Theme & Appearance)
export function useTweaks(defaults = {}) {
  const [tweaks, setTweaks] = useState(defaults);
  
  const setTweak = useCallback((key, value) => {
    setTweaks(prev => ({ ...prev, [key]: value }));
  }, []);
  
  return [tweaks, setTweaks, setTweak];
}

// Legacy compatibility - attach to window
if (typeof window !== 'undefined') {
  Object.assign(window, {
    useJobs, useActivities, useRuns, useStatic, useProfile, useTweaks,
  });
}