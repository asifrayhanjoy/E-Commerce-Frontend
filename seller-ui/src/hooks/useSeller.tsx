import axiosInstance from "@/utils/axiosInstance";
import { useQuery } from "@tanstack/react-query";

// fetch user data from API
const fetchSeller = async () => {
  const response = await axiosInstance.get("/api/v1/auth/loged-in-seller");
  return response.data.user;
};

const useSeller = () => {
  const {
    data: seller,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["seller"],
    queryFn: fetchSeller,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  return { seller, isLoading, isError, refetch };
};

export default useSeller;