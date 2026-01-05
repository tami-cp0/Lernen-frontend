'use client';
import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from 'react';
import { apiRequest } from '@/lib/api-client';

type User = {
	id: string;
	email: string;
	firstName: string;
	lastName: string;
};

type UserContextType = {
	user: User | null;
	isLoading: boolean;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const userData = await apiRequest<{ data: { user: User } }>(
					'users/profile'
				);
				setUser(userData.data.user);
			} catch (error) {
				console.error('Error fetching user:', error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchUser();
	}, []);

	return (
		<UserContext.Provider value={{ user, isLoading }}>
			{children}
		</UserContext.Provider>
	);
}

export function useUser() {
	const context = useContext(UserContext);
	if (context === undefined) {
		throw new Error('useUser must be used within a UserProvider');
	}
	return context;
}
