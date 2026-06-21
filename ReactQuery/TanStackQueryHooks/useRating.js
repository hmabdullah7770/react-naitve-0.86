import  {addrating}  from '../../API/rating';
import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

export const useRating = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payload => addrating(payload),
    onSuccess: (data) => {
      console.log('Added rating successfully', data)
      queryClient.invalidateQueries({ queryKey: ['rating'] })
    },
    onError: error => {
      console.error('Add rating error:', error)
    },
  })
}
