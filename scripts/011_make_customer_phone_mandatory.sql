-- Make phone column in customers table mandatory
ALTER TABLE customers ALTER COLUMN phone SET NOT NULL;
