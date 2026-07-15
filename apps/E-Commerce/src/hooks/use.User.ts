import { isProtected } from "@/store/isProtected";
import { useAuthStore } from "@/store/useAuthStor";
import axiosInstance from "@/utils/axiosinstance";
import { useQuery } from "@tanstack/react-query";

// fetch user data from API
const fetchUser = async (isLoggedIn:boolean) => {
  const config = isLoggedIn ? isProtected : {};
  const response = await axiosInstance.get("/api/v1/auth/login-in-user", config);
  return response.data.user;
};

const useUser = () => {
  
  const {setLoggedIn, isLoggedIn}= useAuthStore();
  const {data: user, isError,} = useQuery({
    queryKey: ["user"],
    queryFn: () => fetchUser(isLoggedIn),
    staleTime: 1000 * 60 * 5,
retry: false,

// @ts-ignore
onSuccess: () => {
  setLoggedIn(true);
},

onError: () => {
  setLoggedIn(false);
},
});

return {
  user: user as any,
  isLoading:
  isError,
};
}

export default useUser;