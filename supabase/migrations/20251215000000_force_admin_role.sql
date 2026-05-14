-- Force admin role for the specific admin user
UPDATE public.athletes 
SET role = 'admin' 
WHERE email = 'adminnahel@gmail.com';
