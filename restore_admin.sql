-- RUN THIS IN NEON SQL EDITOR TO RESTORE ADMIN ACCESS

INSERT INTO companies (name, email, password, role, "isVerified")
VALUES ('Master Admin', 'admin@yenza.com', 'admin123', 'admin', true);

-- If it says "duplicate key value", it means admin exists. 
-- In that case, run this to reset the password:
-- UPDATE companies SET password = 'admin123', role = 'admin' WHERE email = 'admin@yenza.com';
