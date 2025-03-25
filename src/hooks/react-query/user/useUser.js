import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseClient } from '../../../lib/supabase';

const fetchCurrentUser = async () => {
    const {
        data: { user },
    } = await supabaseClient.auth.getUser();

    return user;
};

export const useUser = () => {
    return useQuery({
        queryKey: ['currentUser'],
        queryFn: fetchCurrentUser,
        staleTime: 1000 * 60 * 60, // 60 minutes
        cacheTime: 1000 * 60 * 60, // Cache for 60 minutes
    });
};
// Functions for login, logout, and register
const loginUser = async ({ email, password }) => {
    let { data, error } = await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        throw new Error(error.message);
    }
    return data.user;
};

const logoutUser = async () => {
    await supabaseClient.auth.signOut();
};

const registerUser = async ({ email, password }) => {
    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.log(error);
        throw new Error(error.message);
    }

    return data.user;
};

// Hooks for mutations
export const useLoginUser = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: loginUser,
        onSuccess: async (data) => {
            await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            await queryClient.setQueryData('currentUser', data);
        },
    });
};

export const useLogout = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: logoutUser,
        onSuccess: async () => {
            await queryClient.invalidateQueries();
        },
    });
};

export const useRegisterUser = () => {
    return useMutation({
        mutationFn: registerUser,
        onSuccess: async () => {
            return true;
        },
    });
};
