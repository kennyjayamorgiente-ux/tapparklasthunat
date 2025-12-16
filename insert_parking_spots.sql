-- Get the parking_section_id for Section A in parking_area_id 2
SET @section_id = (
    SELECT ps.parking_section_id 
    FROM parking_section ps
    WHERE ps.parking_area_id = 2 
    AND ps.section_name = 'Section A'
    LIMIT 1
);

-- Insert parking spots F1-A-1 to F1-A-15
INSERT INTO parking_spot (parking_section_id, spot_number, status, spot_type, created_at)
VALUES
    (@section_id, 'F1-A-1', 'available', 'car', NOW()),
    (@section_id, 'F1-A-2', 'available', 'car', NOW()),
    (@section_id, 'F1-A-3', 'available', 'car', NOW()),
    (@section_id, 'F1-A-4', 'available', 'car', NOW()),
    (@section_id, 'F1-A-5', 'available', 'car', NOW()),
    (@section_id, 'F1-A-6', 'available', 'car', NOW()),
    (@section_id, 'F1-A-7', 'available', 'car', NOW()),
    (@section_id, 'F1-A-8', 'available', 'car', NOW()),
    (@section_id, 'F1-A-9', 'available', 'car', NOW()),
    (@section_id, 'F1-A-10', 'available', 'car', NOW()),
    (@section_id, 'F1-A-11', 'available', 'car', NOW()),
    (@section_id, 'F1-A-12', 'available', 'car', NOW()),
    (@section_id, 'F1-A-13', 'available', 'car', NOW()),
    (@section_id, 'F1-A-14', 'available', 'car', NOW()),
    (@section_id, 'F1-A-15', 'available', 'car', NOW())
;

-- Verify the inserts
SELECT 
    ps.parking_spot_id,
    ps.spot_number,
    ps.status,
    ps.spot_type,
    psec.section_name,
    pa.parking_area_name
FROM parking_spot ps
INNER JOIN parking_section psec ON ps.parking_section_id = psec.parking_section_id
INNER JOIN parking_area pa ON psec.parking_area_id = pa.parking_area_id
WHERE psec.section_name = 'Section A' AND pa.parking_area_id = 2
ORDER BY ps.spot_number;

