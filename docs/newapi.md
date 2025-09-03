SCHOOL API CALLS

URL:
https://school-app-backend-d143b785b631.herokuapp.com/

https://ajws-school-ba8ae5e3f955.herokuapp.com


Principal Login:
 {
     "phone_number":1234567891,
     "password":"password123"
}

Admin Login:
{
  "phone_number": "1234567890",
  "password": "Shilpa@123"
}

User Registration
Register System admin
Post Call
http://localhost:3000/api/system/register-first-admin
Payload:
{
  "phone_number": "1234567890",
  "password": "Shilpa@123",
  "full_name": "Shilpa",
  "email": "shilpa.tribhuwan@gmail.com"
}
Response:
{
    "status": "success",
    "message": "System admin created successfully. You can now log in.",
    "data": {
        "id": "6e41e823-e4f9-43fa-ab90-cd886361ed1a",
        "phone_number": "1234567890",
        "full_name": "Shilpa",
        "email": "shilpa.tribhuwan@gmail.com",
        "role": "admin"
    }
}

Register Users
Post Call
http://localhost:3000/api/auth/register
Payload: (Roles: "parent","teacher","admin","principal")
(Principal)
{
    "phone_number": "1234567891",
    "password": "password123",
    "role": "principal",
    "email":"abc@123.com",
    "full_name": "Principal 1"
}
(Parent)
{
    "phone_number": "1234567892",
    "password": "password123",
    "role": "parent",
    "email":"abc@123.com",
    "full_name": "Parent 1"
}
Response:
{
    "status": "success",
    "data": {
        "user": {
            "id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
            "phone_number": "1234567892",
            "role": "parent",
            "full_name": "Parent 1"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMjk5ZGU1Yy02M2ZmLTRlNjAtOGFlMS03MTYwMGIyOWJhODYiLCJyb2xlIjoicGFyZW50IiwiaWF0IjoxNzUzNDIwNjc2LCJleHAiOjE3NTM1MDcwNzZ9.4Uzbw56vCQHVjfgPn7xe7UdMpqxrZFjiK_o-yEpNhpQ"
    }
}



Login
Post Call
http://localhost:3000/api/auth/login
Payload:
{
    "phone_number": "1234567890",
    "password": "Shilpa@123"
}
Response:
{
    "status": "success",
    "data": {
        "user": {
            "id": "6e41e823-e4f9-43fa-ab90-cd886361ed1a",
            "phone_number": "1234567890",
            "role": "admin",
            "full_name": "Shilpa"
        },
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ZTQxZTgyMy1lNGY5LTQzZmEtYWI5MC1jZDg4NjM2MWVkMWEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NTM0MjAyNDksImV4cCI6MTc1MzUwNjY0OX0.q0fVFantiM5qAWV5uXOq9WUVwsUzj9rmWuUYysTJY2g"
    }
}

Current User Details
Get Call
http://localhost:3000/api/users/profile
Response:
{
    "status": "success",
    "data": {
        "user": {
            "id": "6e41e823-e4f9-43fa-ab90-cd886361ed1a",
            "phone_number": "1234567890",
            "role": "admin",
            "full_name": "Shilpa",
            "email": "shilpa.tribhuwan@gmail.com",
            "preferred_language": "english",
            "last_login": "2025-07-25T05:10:49.542+00:00"
        }
    }
}

Add Teacher (Admin/ Principal)
Post Call
http://localhost:3000/api/lists/staff/with-user
PayLoad:
{
  "full_name": "Teacher 2",
  "role": "teacher",
  "department": "Mathematics",
  "phone_number": "1234567894",
  "email":"abc@email.com",
  "qualification": "M.Sc. Mathematics",
   "password": "password123",
  "experience_years": 2
}
Response:
{
    "status": "success",
    "message": "Staff member and user account created successfully",
    "data": {
        "staff": {
            "id": "c4a6d1d5-070c-4af3-9899-df519f4a9e91",
            "full_name": "Teacher 2",
            "phone_number": "1234567894",
            "email": null,
            "role": "teacher",
            "subject": null,
            "department": "Mathematics",
            "designation": "Teacher",
            "joining_date": null,
            "address": null,
            "emergency_contact": null,
            "emergency_contact_phone": null,
            "is_active": true,
            "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
            "created_at": "2025-08-01T12:24:59.151577+00:00",
            "updated_at": "2025-08-01T12:24:59.151577+00:00"
        },
        "user": {
            "id": "2de636ed-f6ad-4820-b218-d2bdeaae796d",
            "full_name": "Teacher 2",
            "phone_number": "1234567894"
        },
        "login_credentials": {
            "phone_number": "1234567894",
            "password": "password123"
        }
    }
}

Get All Staff
Get Call
http://localhost:3000/api/lists/staff?page=2&limit=2
Response:
{
    "status": "success",
    "data": {
        "staff": [
            {
                "id": "c4a6d1d5-070c-4af3-9899-df519f4a9e91",
                "full_name": "Teacher 2",
                "phone_number": "1234567894",
                "email": null,
                "role": "teacher",
                "subject": null,
                "department": "Mathematics",
                "designation": "Teacher",
                "joining_date": null,
                "address": null,
                "emergency_contact": null,
                "emergency_contact_phone": null,
                "is_active": true,
                "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                "created_at": "2025-08-01T12:24:59.151577+00:00",
                "updated_at": "2025-08-01T12:24:59.151577+00:00"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 3,
            "total_pages": 1
        }
    }
}

Update Staff details
Put Call
http://localhost:3000/api/lists/staff/c4a6d1d5-070c-4af3-9899-df519f4a9e91
Response:

Get All Students
Get Call
http://school-app-backend-d143b785b631.herokuapp.com/api/students?page=1&limit=20
https://ajws-school-ba8ae5e3f955.herokuapp.com/api/students?class_division_id=91d1cd06-a896-4409-81a5-8fcd2b64e4b0
https://ajws-school-ba8ae5e3f955.herokuapp.com/api/students?class_division_id=91d1cd06-a896-4409-81a5-8fcd2b64e4b0&academic_year=f6905bae-23b4-45fc-bcf2-4bb19beee945
Response:
{
    "status": "success",
    "data": {
        "students": [
            {
                "id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                "full_name": "Student 1",
                "admission_number": "2025001",
                "date_of_birth": "2018-05-15",
                "admission_date": "2025-06-01",
                "status": "active",
                "student_academic_records": [
                    {
                        "id": "5b1585ce-0884-4bd7-9f40-96fb0c86c917",
                        "status": "ongoing",
                        "created_at": "2025-07-25T08:22:04.803688+00:00",
                        "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                        "roll_number": "01",
                        "class_division": {
                            "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                            "level": {
                                "id": "36bb861b-eed6-4038-8ad4-524441cde543",
                                "name": "Grade 1",
                                "created_at": "2025-07-25T07:15:37.489402+00:00",
                                "sequence_number": 1
                            },
                            "teacher": {
                                "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                                "full_name": "Teacher 1"
                            },
                            "division": "A",
                            "created_at": "2025-07-25T07:49:37.097542+00:00",
                            "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                            "academic_year": {
                                "id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                                "end_date": "2026-03-31",
                                "is_active": false,
                                "year_name": "2025-2026",
                                "created_at": "2025-07-25T07:41:46.384961+00:00",
                                "start_date": "2025-06-01"
                            },
                            "class_level_id": "36bb861b-eed6-4038-8ad4-524441cde543",
                            "academic_year_id": "f6905bae-23b4-45fc-bcf2-4bb19beee945"
                        },
                        "academic_year_id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                        "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b"
                    }
                ],
                "parent_student_mappings": [
                    {
                        "id": "a74fa461-5d2c-45aa-b422-a6315b6bb8e4",
                        "parent": {
                            "id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
                            "email": null,
                            "full_name": "Parent 1",
                            "phone_number": "1234567892"
                        },
                        "parent_id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
                        "created_at": "2025-07-26T11:45:13.742165+00:00",
                        "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                        "updated_at": "2025-07-26T11:45:13.742165+00:00",
                        "access_level": "full",
                        "relationship": "father",
                        "is_primary_guardian": true
                    }
                ]
            }
        ],
        "count": 4,
        "total_count": 4,
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 4,
            "total_pages": 1,
            "has_next": false,
            "has_prev": false
        },
        "filters": {
            "search": null,
            "class_division_id": null,
            "class_level_id": null,
            "academic_year_id": null,
            "status": "active",
            "unlinked_only": false
        },
        "available_filters": {
            "academic_years": [
                {
                    "id": "59db64e5-e987-45e5-9b1c-dd9082adbf7b",
                    "year_name": "2029-2030"
                }
            ],
            "class_levels": [
                {
                    "id": "36bb861b-eed6-4038-8ad4-524441cde543",
                    "name": "Grade 1",
                    "sequence_number": 1
                }
            ],
            "class_divisions": null
        }
    }
}

Create Parent
Post Call
http://school-app-backend-d143b785b631.herokuapp.com/api/auth/create-parent
PayLoad:
{
    "full_name": "Parent 4",
    "phone_number": "1234567897",
    "email": "parent4@example.com",
"initial_password": "Temp@1234",
    "student_details": [
      {
        "admission_number": "2025057",
        "relationship": "father",
        "is_primary_guardian": true
      }
    ]
  }
Response:
{
    "status": "success",
    "data": {
        "parent": {
            "id": "63e72e23-69ce-46ac-8cec-39188ab8cb9b",
            "full_name": "Parent 4",
            "phone_number": "1234567897",
            "email": "parent4@example.com",
            "role": "parent",
            "is_registered": false
        },
        "students": [
            {
                "id": "4b33eb05-b7f9-4092-b171-e10b461e8d3f",
                "admission_number": "2025057",
                "full_name": "Student 4"
            }
        ],
        "mappings": [
            {
                "relationship": "father",
                "is_primary_guardian": true,
                "access_level": "full"
            }
        ],
        "registration_instructions": {
            "message": "Parent can now register using their phone number",
            "endpoint": "POST /api/auth/register",
            "required_fields": [
                "phone_number",
                "password",
                "role: \"parent\""
            ]
        },
        "note": "Parent-student mappings created using /api/academic/link-students endpoint"
    },
    "message": "Parent record created successfully. Parent can now register using their phone number."
}

Get All Parent
Get Call
https://school-app-backend-d143b785b631.herokuapp.com/api/parent-student/parents
https://school-app-backend-d143b785b631.herokuapp.com/api/parent-student/parents?class_id=123e4567-e89b-12d3-a456-426614174000&page=2&limit=10
https://school-app-backend-d143b785b631.herokuapp.com/api/parent-student/parents?class_division_id=456e7890-e89b-12d3-a456-426614174000
https://school-app-backend-d143b785b631.herokuapp.com/api/parent-student/parents?student_id=789e0123-e89b-12d3-a456-426614174000
https://school-app-backend-d143b785b631.herokuapp.com/api/parent-student/parents?class_id=123e4567-e89b-12d3-a456-426614174000&search=john
https://ajws-school-ba8ae5e3f955.herokuapp.com/api/parent-student/parents?search=jyoti@gmail.com
https://ajws-school-ba8ae5e3f955.herokuapp.com/api/parent-student/parents?search=2222222289


Response:
{
    "status": "success",
    "data": {
        "parents": [
            {
                "id": "b4d83189-e340-4ec6-bd48-8514d43e9e2d",
                "full_name": "Jyoti Tribhuwan",
                "phone_number": "8080830803",
                "email": "jyoti@gmail.com",
                "role": "parent",
                "is_registered": false,
                "created_at": "2025-08-19T20:13:57.573792+00:00",
                "children": []
            },
            {
                "id": "6c20bd61-8911-478c-891a-9da18aadf0cf",
                "full_name": "Mangal",
                "phone_number": "2222222289",
                "email": null,
                "role": "parent",
                "is_registered": true,
                "created_at": "2025-08-04T11:04:41.546933+00:00",
                "children": []
            },
            {
                "id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
                "full_name": "Parent 1",
                "phone_number": "1234567892",
                "email": null,
                "role": "parent",
                "is_registered": true,
                "created_at": "2025-07-25T05:17:57.155084+00:00",
                "children": []
            },
            {
                "id": "63e72e23-69ce-46ac-8cec-39188ab8cb9b",
                "full_name": "Parent 4",
                "phone_number": "1234567897",
                "email": "parent4@example.com",
                "role": "parent",
                "is_registered": false,
                "created_at": "2025-08-04T12:18:12.240537+00:00",
                "children": []
            },
            {
                "id": "d01da801-0a5c-4b40-b050-6915fffee402",
                "full_name": "Sandhya",
                "phone_number": "2222222190",
                "email": null,
                "role": "parent",
                "is_registered": true,
                "created_at": "2025-08-05T06:02:13.167942+00:00",
                "children": []
            },
            {
                "id": "7eb86e9a-d173-4d36-8b34-71ef2b124dfb",
                "full_name": "Vishu",
                "phone_number": "8748060201",
                "email": null,
                "role": "parent",
                "is_registered": true,
                "created_at": "2025-08-05T14:39:36.374902+00:00",
                "children": []
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 6,
            "total_pages": 1
        }
    }
}



For Parents
Fetch Children Details
Get Call
http://localhost:3000/api/users/children
Response:
{
    "status": "success",
    "data": {
        "children": [
            {
                "id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                "full_name": "Student 1",
                "admission_number": "2025001",
                "relationship": "father",
                "is_primary_guardian": true,
                "class_info": {
                    "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                    "class_name": "Grade 1 A",
                    "class_level": "Grade 1",
                    "division": "A",
                    "sequence_number": 1,
                    "academic_year": "2025-2026",
                    "roll_number": "01",
                    "teacher": {
                        "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                        "full_name": "Teacher 1",
                        "phone_number": "1234567893",
                        "email": null,
                        "department": "Teaching",
                        "designation": "Teacher"
                    },
                    "has_teacher": true
                }
            }
        ],
        "debug": {
            "authenticated_user_id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
            "mappings_count": 1
        }
    }
}

Get All Messages
Get Call
http://localhost:3000/api/messages
Response:
{
    "status": "success",
    "data": {
        "messages": [
            {
                "id": "c9e68859-920c-47e7-af91-5c55bef8a1bd",
                "sender_id": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "recipient_id": null,
                "content": "Announcement from principal",
                "type": "announcement",
                "status": "approved",
                "created_at": "2025-07-30T12:37:34.410891+00:00",
                "updated_at": "2025-07-30T12:37:34.410891+00:00",
                "approved_by": null,
                "sender": {
                    "id": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                    "role": "principal",
                    "full_name": "Principal 1"
                },
                "recipient": null,
                "class": null,
                "children_affected": [
                    {
                        "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                        "student_name": "Student 1",
                        "roll_number": "01"
                    }
                ],
                "class_students_count": 1
            },
            {
                "id": "f727f35d-1ca1-484c-bda2-95b6321c1106",
                "sender_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "recipient_id": null,
                "content": "Message content From Teacher",
                "type": "group",
                "status": "approved",
                "created_at": "2025-07-30T08:29:19.653642+00:00",
                "updated_at": "2025-07-30T09:59:33.062646+00:00",
                "approved_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                "sender": {
                    "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                    "role": "teacher",
                    "full_name": "Teacher 1"
                },
                "recipient": null,
                "class": null,
                "children_affected": [
                    {
                        "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                        "student_name": "Student 1",
                        "roll_number": "01"
                    }
                ],
                "class_students_count": 1
            }
        ]
    }
}

Get Messages (For 1 student)
Get Call
http://localhost:3000/api/messages?student_id=d2e4585e-830c-40ba-b29c-cc62ff146607
Response:
{
    "status": "success",
    "data": {
        "messages": [
            {
                "id": "c9e68859-920c-47e7-af91-5c55bef8a1bd",
                "sender_id": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "recipient_id": null,
                "content": "Announcement from principal",
                "type": "announcement",
                "status": "approved",
                "created_at": "2025-07-30T12:37:34.410891+00:00",
                "updated_at": "2025-07-30T12:37:34.410891+00:00",
                "approved_by": null,
                "sender": {
                    "id": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                    "role": "principal",
                    "full_name": "Principal 1"
                },
                "recipient": null,
                "class": null,
                "children_affected": [
                    {
                        "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                        "student_name": "Student 1",
                        "roll_number": "01"
                    }
                ],
                "class_students_count": 1
            },
            {
                "id": "f727f35d-1ca1-484c-bda2-95b6321c1106",
                "sender_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "recipient_id": null,
                "content": "Message content From Teacher",
                "type": "group",
                "status": "approved",
                "created_at": "2025-07-30T08:29:19.653642+00:00",
                "updated_at": "2025-07-30T09:59:33.062646+00:00",
                "approved_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                "sender": {
                    "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                    "role": "teacher",
                    "full_name": "Teacher 1"
                },
                "recipient": null,
                "class": null,
                "children_affected": [
                    {
                        "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                        "student_name": "Student 1",
                        "roll_number": "01"
                    }
                ],
                "class_students_count": 1
            }
        ]
    }
}

Get Parents Details
Get Call
http://localhost:3000/api/parent-student/parents
Response:
{
    "status": "success",
    "data": {
        "parents": [
            {
                "id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
                "full_name": "Parent 1",
                "phone_number": "1234567892",
                "email": null,
                "role": "parent",
                "created_at": "2025-07-25T05:17:57.155084+00:00",
                "children": [
                    {
                        "id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                        "full_name": "Student 1",
                        "admission_number": "2025001"
                    }
                ]
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 1,
            "total_pages": 1
        }
    }
}

Get Children Details
Get Call
https://school-app-backend-d143b785b631.herokuapp.com/api/users/children/teachers
Response:
{
    "status": "success",
    "data": {
        "principal": {
            "id": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
            "full_name": "Principal 1"
        },
        "teachers_by_child": [
            {
                "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "teachers": [
                    {
                        "assignment_id": "a7c70452-7295-44da-a348-e190e4d02feb",
                        "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                        "full_name": "Teacher 1",
                        "phone_number": "1234567893",
                        "email": null,
                        "assignment_type": "class_teacher",
                        "subject": null,
                        "is_primary": true
                    }
                ]
            }
        ]
    }
}


Get parent by id
Get Call
https://ajws-school-ba8ae5e3f955.herokuapp.com/api/parent-student/parents/7eb86e9a-d173-4d36-8b34-71ef2b124dfb
Response:
{
    "status": "success",
    "data": {
        "parent": {
            "id": "7eb86e9a-d173-4d36-8b34-71ef2b124dfb",
            "full_name": "Vishu",
            "phone_number": "8748060201",
            "email": null,
            "role": "parent",
            "created_at": "2025-08-05T14:39:36.374902+00:00",
            "children": [
                {
                    "id": "76845e54-b90e-448c-a9eb-8b8140aa3106",
                    "full_name": "Student 10",
                    "admission_number": "2025010",
                    "date_of_birth": "2018-05-15",
                    "relationship": "mother",
                    "is_primary_guardian": false
                },
                {
                    "id": "20280813-e987-49b0-841a-3c916001f116",
                    "full_name": "Student 11",
                    "admission_number": "2025011",
                    "date_of_birth": "2018-05-15",
                    "relationship": "mother",
                    "is_primary_guardian": false
                },
                {
                    "id": "5866ce2b-4522-400b-9e58-9bdfd6238297",
                    "full_name": "Student 12",
                    "admission_number": "2025012",
                    "date_of_birth": "2018-05-17",
                    "relationship": "father",
                    "is_primary_guardian": false
                },
                {
                    "id": "7c094fc9-b74a-4de9-8b48-407957e8737f",
                    "full_name": "Kushal kumar Gupta",
                    "admission_number": "12345",
                    "date_of_birth": "2003-02-05",
                    "relationship": "father",
                    "is_primary_guardian": false
                }
            ]
        }
    }
}










Academic Year And Classes Setup
Create class
Post Call
http://localhost:3000/api/academic/class-levels
PayLoad:
{
  "name": "Grade 1",
  "sequence_number": 1
}
Response:
{
    "status": "success",
    "data": {
        "class_level": {
            "id": "36bb861b-eed6-4038-8ad4-524441cde543",
            "name": "Grade 1",
            "sequence_number": 1,
            "created_at": "2025-07-25T07:15:37.489402+00:00"
        }
    }
}
Get All Classes
Get Call
http://localhost:3000/api/academic/class-levels
Response:
{
    "status": "success",
    "data": {
        "class_levels": [
            {
                "id": "36bb861b-eed6-4038-8ad4-524441cde543",
                "name": "Grade 1",
                "sequence_number": 1,
                "created_at": "2025-07-25T07:15:37.489402+00:00"
            },
            {
                "id": "1e85bc0f-8fe5-4c25-9a19-1f6cc9f36d20",
                "name": "Grade 2",
                "sequence_number": 2,
                "created_at": "2025-07-25T07:17:07.9027+00:00"
            },
            {
                "id": "0da58ae9-5f0b-4617-8f1d-66090dcd26f9",
                "name": "Grade 3",
                "sequence_number": 3,
                "created_at": "2025-07-25T07:17:18.715633+00:00"
            }
        ]
    }
}
Create Academic year
Post Call
http://localhost:3000/api/academic/years
Payload:
{
    "year_name": "2025-2026",
    "start_date": "2025-06-01",
    "end_date": "2026-03-31",
    "is_active": true
}
Response:
{
    "year_name": "2025-2026",
    "start_date": "2025-06-01",
    "end_date": "2026-03-31",
    "is_active": true
}

Get Academic Years
Get Call
http://localhost:3000/api/academic/years
Response:
{
    "status": "success",
    "data": {
        "academic_years": [
            {
                "id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                "year_name": "2025-2026",
                "start_date": "2025-06-01",
                "end_date": "2026-03-31",
                "is_active": true,
                "created_at": "2025-07-25T07:41:46.384961+00:00"
            }
        ]
    }
}

Create Class Divisions
Post Call
http://localhost:3000/api/academic/class-divisions
Payload:
{
  "academic_year_id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
  "class_level_id": "36bb861b-eed6-4038-8ad4-524441cde543",
  "division": "A"
}
Response:
{
    "status": "success",
    "data": {
        "class_division": {
            "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "academic_year_id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
            "class_level_id": "36bb861b-eed6-4038-8ad4-524441cde543",
            "division": "A",
            "teacher_id": null,
            "created_at": "2025-07-25T07:49:37.097542+00:00"
        }
    }
}

Get Class Divisions
Get Call
http://localhost:3000/api/academic/class-divisions
Response:
{
    "status": "success",
    "data": {
        "class_divisions": [
            {
                "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "academic_year_id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                "class_level_id": "36bb861b-eed6-4038-8ad4-524441cde543",
                "division": "A",
                "teacher_id": null,
                "created_at": "2025-07-25T07:49:37.097542+00:00",
                "academic_year": {
                    "year_name": "2025-2026"
                },
                "class_level": {
                    "name": "Grade 1",
                    "sequence_number": 1
                },
                "teacher": null
            },
            {
                "id": "d5e2c45b-bce9-45c2-bb4e-caa6add083e1",
                "academic_year_id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                "class_level_id": "36bb861b-eed6-4038-8ad4-524441cde543",
                "division": "B",
                "teacher_id": null,
                "created_at": "2025-07-25T07:51:19.778894+00:00",
                "academic_year": {
                    "year_name": "2025-2026"
                },
                "class_level": {
                    "name": "Grade 1",
                    "sequence_number": 1
                },
                "teacher": null
            }
        ]
    }
}

Get Class Division Summary (Admin/ Principal)
Get Call
http://localhost:3000/api/students/divisions/summary
https://school-app-backend-d143b785b631.herokuapp.com/api/students/divisions/summary?academic_year_id=f6905bae-23b4-45fc-bcf2-4bb19beee945

Response:
{
    "status": "success",
    "data": {
        "divisions": [
            {
                "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "division": "A",
                "level": {
                    "id": "36bb861b-eed6-4038-8ad4-524441cde543",
                    "name": "Grade 1",
                    "sequence_number": 1
                },
                "academic_year": {
                    "id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                    "is_active": false,
                    "year_name": "2025-2026"
                },
                "class_teacher": {
                    "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                    "name": "Teacher 1",
                    "is_class_teacher": true
                },
                "subject_teachers": [
                    {
                        "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                        "name": "Teacher 1",
                        "subject": "Mathematics",
                        "is_class_teacher": true
                    }
                ],
                "subjects": [
                    {
                        "id": "b45465e3-016d-4131-8ad8-33b0adb3c0ff",
                        "name": "English",
                        "code": "12345"
                    },
                    {
                        "id": "8d91dfcc-97e1-4c98-b5f7-3ce9915092a2",
                        "name": "Mathematics",
                        "code": "MATH"
                    }
                ],
                "student_count": 7
            },
            {
                "id": "d5e2c45b-bce9-45c2-bb4e-caa6add083e1",
                "division": "B",
                "level": {
                    "id": "36bb861b-eed6-4038-8ad4-524441cde543",
                    "name": "Grade 1",
                    "sequence_number": 1
                },
                "academic_year": {
                    "id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                    "is_active": false,
                    "year_name": "2025-2026"
                },
                "class_teacher": {
                    "id": "af68c9d4-7825-476f-9f3d-7863339442dd",
                    "name": "Vaishnavi",
                    "is_class_teacher": true
                },
                "subject_teachers": [
                    {
                        "id": "af68c9d4-7825-476f-9f3d-7863339442dd",
                        "name": "Vaishnavi",
                        "subject": null,
                        "is_class_teacher": true
                    },
                    {
                        "id": "af68c9d4-7825-476f-9f3d-7863339442dd",
                        "name": "Vaishnavi",
                        "subject": "English",
                        "is_class_teacher": true
                    }
                ],
                "subjects": [
                    {
                        "id": "b45465e3-016d-4131-8ad8-33b0adb3c0ff",
                        "name": "English",
                        "code": "12345"
                    }
                ],
                "student_count": 5
            },
            {
                "id": "91d1cd06-a896-4409-81a5-8fcd2b64e4b0",
                "division": "C",
                "level": {
                    "id": "81921218-7c6d-471b-b0ce-5aaa70bba12c",
                    "name": "Grade 4",
                    "sequence_number": 4
                },
                "academic_year": {
                    "id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                    "is_active": false,
                    "year_name": "2025-2026"
                },
                "class_teacher": {
                    "id": "af68c9d4-7825-476f-9f3d-7863339442dd",
                    "name": "Vaishnavi",
                    "is_class_teacher": true
                },
                "subject_teachers": [
                    {
                        "id": "af68c9d4-7825-476f-9f3d-7863339442dd",
                        "name": "Vaishnavi",
                        "subject": null,
                        "is_class_teacher": true
                    },
                    {
                        "id": "53780607-1a69-487b-9c70-709b16c999bc",
                        "name": "Shubham",
                        "subject": "English",
                        "is_class_teacher": false
                    }
                ],
                "subjects": [
                    {
                        "id": "8d91dfcc-97e1-4c98-b5f7-3ce9915092a2",
                        "name": "Mathematics",
                        "code": "MATH"
                    },
                    {
                        "id": "b45465e3-016d-4131-8ad8-33b0adb3c0ff",
                        "name": "English",
                        "code": "12345"
                    }
                ],
                "student_count": 1
            }
        ],
        "total_divisions": 3,
        "total_students": 13,
        "academic_year": {
            "id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
            "name": "2025-2026"
        },
        "summary": {
            "total_subject_teachers": 5,
            "total_subjects": 5,
            "divisions_with_class_teachers": 3,
            "divisions_with_subject_teachers": 3
        }
    }
}


Get Class Division Summary of a Teacher (Admin)
Get Call
https://school-app-backend-d143b785b631.herokuapp.com/api/students/divisions/teacher/df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51/summary
Response:
{
    "status": "success",
    "data": {
        "teacher": {
            "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
            "name": "Teacher 1",
            "role": "teacher"
        },
        "divisions": [
            {
                "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "division": "A",
                "level": {
                    "id": "36bb861b-eed6-4038-8ad4-524441cde543",
                    "name": "Grade 1",
                    "sequence_number": 1
                },
                "academic_year": {
                    "id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                    "is_active": false,
                    "year_name": "2025-2026"
                },
                "class_teacher": {
                    "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                    "name": "Teacher 1",
                    "is_class_teacher": true
                },
                "subject_teachers": [
                    {
                        "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                        "name": "Teacher 1",
                        "subject": "Mathematics",
                        "assignment_type": "class_teacher",
                        "is_class_teacher": true
                    }
                ],
                "subjects": [
                    {
                        "id": "b45465e3-016d-4131-8ad8-33b0adb3c0ff",
                        "name": "English",
                        "code": "12345"
                    },
                    {
                        "id": "8d91dfcc-97e1-4c98-b5f7-3ce9915092a2",
                        "name": "Mathematics",
                        "code": "MATH"
                    }
                ],
                "student_count": 7,
                "teacher_assignment": {
                    "type": "class_teacher",
                    "is_primary": true,
                    "subject": null
                }
            }
        ],
        "primary_assignments": [
            {
                "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "division": "A",
                "level": {
                    "id": "36bb861b-eed6-4038-8ad4-524441cde543",
                    "name": "Grade 1",
                    "sequence_number": 1
                },
                "academic_year": {
                    "id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                    "is_active": false,
                    "year_name": "2025-2026"
                },
                "class_teacher": {
                    "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                    "name": "Teacher 1",
                    "is_class_teacher": true
                },
                "subject_teachers": [
                    {
                        "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                        "name": "Teacher 1",
                        "subject": "Mathematics",
                        "assignment_type": "class_teacher",
                        "is_class_teacher": true
                    }
                ],
                "subjects": [
                    {
                        "id": "b45465e3-016d-4131-8ad8-33b0adb3c0ff",
                        "name": "English",
                        "code": "12345"
                    },
                    {
                        "id": "8d91dfcc-97e1-4c98-b5f7-3ce9915092a2",
                        "name": "Mathematics",
                        "code": "MATH"
                    }
                ],
                "student_count": 7,
                "teacher_assignment": {
                    "type": "class_teacher",
                    "is_primary": true,
                    "subject": null
                }
            }
        ],
        "secondary_assignments": [],
        "total_divisions": 1,
        "total_students": 7,
        "academic_year": {
            "id": null,
            "name": "All Years"
        },
        "summary": {
            "total_subject_teachers": 1,
            "total_subjects": 2,
            "divisions_with_class_teachers": 1,
            "divisions_with_subject_teachers": 1,
            "primary_assignments_count": 1,
            "secondary_assignments_count": 0,
            "subjects_taught": []
        }
    }
}

Subject
Add Subject
Post Call
https://school-app-backend-d143b785b631.herokuapp.com/api/academic/subjects
Payload:
{ "name": "Mathematics", "code": "MATH" }
Response:
{
    "status": "success",
    "data": {
        "subject": {
            "id": "8d91dfcc-97e1-4c98-b5f7-3ce9915092a2",
            "name": "Mathematics",
            "code": "MATH",
            "is_active": true,
            "created_at": "2025-08-19T13:03:20.891249+00:00",
            "updated_at": "2025-08-19T13:03:20.891249+00:00"
        }
    }
}


Get All Subjects
Get Call
https://school-app-backend-d143b785b631.herokuapp.com/api/academic/subjects
Response:
{
    "status": "success",
    "data": {
        "subjects": [
            {
                "id": "8d91dfcc-97e1-4c98-b5f7-3ce9915092a2",
                "name": "Mathematics",
                "code": "MATH",
                "is_active": true,
                "created_at": "2025-08-19T13:03:20.891249+00:00",
                "updated_at": "2025-08-19T13:03:20.891249+00:00"
            }
        ]
    }
}
Assign subject to the Class division
- **mode**: `replace` (default) deactivates subjects not in list; `append` only adds/reactivates provided subjects
Post Call
https://school-app-backend-d143b785b631.herokuapp.com/api/academic/class-divisions/4ded8472-fe26-4cf3-ad25-23f601960a0b/subjects
Payload:
{
    "subject_ids": ["8d91dfcc-97e1-4c98-b5f7-3ce9915092a2"],
    "mode": "replace"
}
Response:
{
    "status": "success",
    "data": {
        "activated": [
            {
                "id": "3f1f0847-4509-47a3-b5cb-ffe06de67822",
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "subject_id": "8d91dfcc-97e1-4c98-b5f7-3ce9915092a2",
                "is_active": true,
                "assigned_at": "2025-08-19T13:08:20.697614+00:00",
                "assigned_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6"
            }
        ],
        "deactivated": 0,
        "subjects": [
            {
                "id": "8d91dfcc-97e1-4c98-b5f7-3ce9915092a2",
                "code": "MATH",
                "name": "Mathematics"
            }
        ]
    }
}


Get Subjects assigned to a class
Get Call
https://school-app-backend-d143b785b631.herokuapp.com/api/academic/class-divisions/4ded8472-fe26-4cf3-ad25-23f601960a0b/subjects
Response:
{
    "status": "success",
    "data": {
        "subjects": [
            {
                "id": "8d91dfcc-97e1-4c98-b5f7-3ce9915092a2",
                "code": "MATH",
                "name": "Mathematics"
            }
        ]
    }
}


Delete Assigned subject from class division
Delete call
https://school-app-backend-d143b785b631.herokuapp.com/api/academic/class-divisions/4ded8472-fe26-4cf3-ad25-23f601960a0b/subjects/8d91dfcc-97e1-4c98-b5f7-3ce9915092a2













Student parent Link
Create student
Post Call
https://ajws-school-ba8ae5e3f955.herokuapp.com/api/students
Payload:
{
    "admission_number": "20250176",
    "full_name": "Student 7",
    "date_of_birth": "2018-08-25",
    "admission_date": "2025-08-04",
    "class_division_id": "91d1cd06-a896-4409-81a5-8fcd2b64e4b0",
    "roll_number": "08"
}
Response:
{
    "status": "success",
    "data": {
        "student": {
            "id": "7693e43f-5164-4118-a454-8337426e2e43",
            "admission_number": "20250176",
            "full_name": "Student 7",
            "date_of_birth": "2018-08-25",
            "admission_date": "2025-08-04",
            "status": "active",
            "created_at": "2025-08-22T04:09:44.709054+00:00",
            "profile_photo_path": null
        },
        "academic_record": {
            "id": "9e0e4d62-6d98-4bdc-9d23-48fd6cbecd15",
            "student_id": "7693e43f-5164-4118-a454-8337426e2e43",
            "academic_year_id": null,
            "class_division_id": "91d1cd06-a896-4409-81a5-8fcd2b64e4b0",
            "roll_number": "08",
            "status": "ongoing",
            "created_at": "2025-08-22T04:09:45.063368+00:00"
        }
    }
}

Create Parent
Post Call
https://ajws-school-ba8ae5e3f955.herokuapp.com/api/parents
Response:
{
    "status": "success",
    "data": {
        "parent": {
            "id": "9845e25e-00bd-4c6e-a041-af338b6905d0",
            "full_name": "Parent 7",
            "phone_number": "1234567888",
            "email": "parent7@example.com",
            "role": "parent",
            "is_registered": false
        },
        "registration_instructions": {
            "message": "Parent can now register using their phone number",
            "endpoint": "POST /api/auth/register",
            "required_fields": [
                "phone_number",
                "password",
                "role: \"parent\""
            ]
        },
        "initial_password": "Temp@1234",
        "note": "Use /api/parents/:parent_id/link-students to link this parent to students"
    },
    "message": "Parent created successfully. Parent can now register using their phone number."
}

Link parent to student
Post Call
https://ajws-school-ba8ae5e3f955.herokuapp.com/api/academic/link-students
Payload:
{
  "parent_id": "9845e25e-00bd-4c6e-a041-af338b6905d0",
  "students": [
    {
      "student_id": "7693e43f-5164-4118-a454-8337426e2e43",
      "relationship": "father",
      "is_primary_guardian": true,
      "access_level": "full"
    }
  ]
}
Response:
{
    "status": "success",
    "data": {
        "mappings": [
            {
                "id": "5730c399-3a2f-4292-8992-f1852e5f7501",
                "parent_id": "9845e25e-00bd-4c6e-a041-af338b6905d0",
                "student_id": "7693e43f-5164-4118-a454-8337426e2e43",
                "relationship": "father",
                "is_primary_guardian": true,
                "access_level": "full",
                "created_at": "2025-08-22T04:13:07.149608+00:00",
                "updated_at": "2025-08-22T04:13:07.149608+00:00"
            }
        ]
    }
}


Student
Add Student
Post Call
http://localhost:3000/api/students
Payload:
{
    "admission_number": "2025001",
    "full_name": "Student 1",
    "date_of_birth": "2018-05-15",
    "admission_date": "2025-06-01",
    "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
    "roll_number": "01"
}
Response:
{
    "status": "success",
    "data": {
        "student": {
            "id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
            "admission_number": "2025001",
            "full_name": "Student 1",
            "date_of_birth": "2018-05-15",
            "admission_date": "2025-06-01",
            "status": "active",
            "created_at": "2025-07-25T08:22:04.710942+00:00"
        },
        "academic_record": {
            "id": "5b1585ce-0884-4bd7-9f40-96fb0c86c917",
            "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
            "academic_year_id": null,
            "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "roll_number": "01",
            "status": "ongoing",
            "created_at": "2025-07-25T08:22:04.803688+00:00"
        }
    }
}

Edit student
Put Call
https://ajws-school-ba8ae5e3f955.herokuapp.com/api/students/efe24e05-db0b-47b6-9a63-4cc3df0ce546
Payload:
{
    "gender": "female",  // Can be "male", "female", or "other"
    "blood_group": "O+"  // Can be "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"
}

Response:
{
    "status": "success",
    "data": {
        "student": {
            "id": "efe24e05-db0b-47b6-9a63-4cc3df0ce546",
            "admission_number": "2025002",
            "full_name": "Student 2",
            "date_of_birth": "2018-07-29",
            "admission_date": "2025-07-29",
            "status": "active",
            "created_at": "2025-07-29T10:02:23.542702+00:00",
            "profile_photo_path": null,
            "blood_group": "O+",
            "gender": "female"
        }
    }
}


Link Student to parent(Principal/ Admin access)
Post call
http://localhost:3000/api/academic/link-students
Payload:
{
  "parent_id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
  "students": [
    {
      "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
      "relationship": "father",
      "is_primary_guardian": true,
      "access_level": "full"
    }
  ]
}
Payload(secondary):
{
  "parent_id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
  "students": [
    {
      "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
      "relationship": "mother",
      "is_primary_guardian": false,
      "access_level": "full"
    }
  ]
}

Response:
{
    "status": "success",
    "data": {
        "mappings": [
            {
                "id": "a74fa461-5d2c-45aa-b422-a6315b6bb8e4",
                "parent_id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
                "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                "relationship": "father",
                "is_primary_guardian": true,
                "access_level": "full",
                "created_at": "2025-07-26T11:45:13.742165+00:00",
                "updated_at": "2025-07-26T11:45:13.742165+00:00"
            }
        ]
    }
}

Get Student details
Get Call
http://localhost:3000/api/students/d2e4585e-830c-40ba-b29c-cc62ff146607
Response:
{
    "status": "success",
    "data": {
        "student": {
            "id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
            "full_name": "Student 1",
            "admission_number": "2025001",
            "date_of_birth": "2018-05-15",
            "admission_date": "2025-06-01",
            "status": "active",
            "profile_photo_path": "profile-pictures/students/d2e4585e-830c-40ba-b29c-cc62ff146607/avatar.jpg",
            "student_academic_records": [
                {
                    "id": "5b1585ce-0884-4bd7-9f40-96fb0c86c917",
                    "status": "ongoing",
                    "roll_number": "01",
                    "class_division": {
                        "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                        "level": {
                            "id": "36bb861b-eed6-4038-8ad4-524441cde543",
                            "name": "Grade 1",
                            "sequence_number": 1
                        },
                        "teacher": {
                            "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                            "full_name": "Teacher 1"
                        },
                        "division": "A"
                    }
                }
            ],
            "parent_mappings": [
                {
                    "id": "a74fa461-5d2c-45aa-b422-a6315b6bb8e4",
                    "parent": {
                        "id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
                        "full_name": "Parent 1",
                        "phone_number": "1234567892"
                    },
                    "access_level": "full",
                    "relationship": "father",
                    "is_primary_guardian": true
                },
                {
                    "id": "2359ed33-cecf-44dd-96d5-5aea285a57a6",
                    "parent": {
                        "id": "6c20bd61-8911-478c-891a-9da18aadf0cf",
                        "full_name": "Mangal",
                        "phone_number": "2222222289"
                    },
                    "access_level": "full",
                    "relationship": "father",
                    "is_primary_guardian": false
                }
            ],
            "profile_photo_url": "https://xwqdfnggfamvfiqzpdft.supabase.co/storage/v1/object/public/profile-pictures/students/d2e4585e-830c-40ba-b29c-cc62ff146607/avatar.jpg"
        }
    }
}


Delete mappings for a student
Delete Call
http://localhost:3000/api/users/mappings/9feffb82-788d-478b-bbfc-304fa7750a01
Response:
{
    "status": "success",
    "message": "Parent-student mapping deleted successfully"
}

Student History
Get Call
http://localhost:3000/api/academic/student-history/d2e4585e-830c-40ba-b29c-cc62ff146607
Response:
{
    "status": "success",
    "data": {
        "academic_history": [
            {
                "id": "5b1585ce-0884-4bd7-9f40-96fb0c86c917",
                "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                "academic_year_id": null,
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "roll_number": "01",
                "status": "ongoing",
                "created_at": "2025-07-25T08:22:04.803688+00:00",
                "academic_year": null,
                "class": {
                    "level": {
                        "name": "Grade 1",
                        "sequence_number": 1
                    },
                    "teacher": null,
                    "division": "A"
                }
            }
        ],
        "parents": [
            {
                "relationship": "father",
                "is_primary_guardian": true,
                "access_level": "full",
                "parent": {
                    "id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
                    "email": null,
                    "full_name": "Parent 1",
                    "phone_number": "1234567892"
                }
            }
        ]
    }
}

Create Leave Request
Post Call
http://localhost:3000/api/leave-requests
Payload:
{
  "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
  "start_date": "2025-07-31T00:00:00Z",
  "end_date": "2025-08-01T00:00:00Z",
  "reason": "Reason for leave"
}
Response:
{
    "status": "success",
    "data": {
        "leave_request": {
            "id": "7cd297b8-f333-44a3-beb9-919c94f58698",
            "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
            "start_date": "2025-07-31T00:00:00+00:00",
            "end_date": "2025-08-01T00:00:00+00:00",
            "reason": "Reason for leave",
            "status": "pending",
            "reviewed_by": null,
            "created_at": "2025-07-31T11:39:49.384622+00:00",
            "updated_at": "2025-07-31T11:39:49.384622+00:00"
        }
    }
}

Upload profile photo
Post Call
https://school-app-backend-d143b785b631.herokuapp.com/api/students/d2e4585e-830c-40ba-b29c-cc62ff146607/profile-photo
Response:
{
    "status": "success",
    "data": {
        "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
        "profile_photo_path": "profile-pictures/students/d2e4585e-830c-40ba-b29c-cc62ff146607/avatar.jpg",
        "profile_photo_url": "https://xwqdfnggfamvfiqzpdft.supabase.co/storage/v1/object/public/profile-pictures/students/d2e4585e-830c-40ba-b29c-cc62ff146607/avatar.jpg"
    }
}



Teachers
Assign teacher to the class division (Principal/ Admin Only)
Post Call
http://localhost:3000/api/academic/class-divisions/4ded8472-fe26-4cf3-ad25-23f601960a0b
PayLoad:
{
  "teacher_id": "uuid" // Optional
}

https://school-app-backend-d143b785b631.herokuapp.com/api/academic/class-divisions/4ded8472-fe26-4cf3-ad25-23f601960a0b/assign-teacher
Payload:
{
  "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
  "assignment_type": "class_teacher | subject_teacher | assistant_teacher | substitute_teacher",
  "is_primary": false
}
{
  "teacher_id": "UUID",
  "assignment_type": "subject_teacher",
  "subject": "Math", 
  "is_primary": false
}
Response:
{
    "status": "success",
    "data": {
        "class_division": {
            "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "academic_year_id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
            "class_level_id": "36bb861b-eed6-4038-8ad4-524441cde543",
            "division": "A",
            "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
            "created_at": "2025-07-25T07:49:37.097542+00:00"
        }
    }
}

Edit the teacher assigned to the class
Put Call
https://school-app-backend-d143b785b631.herokuapp.com/api/academic/class-divisions/4ded8472-fe26-4cf3-ad25-23f601960a0b/teacher-assignment/a7c70452-7295-44da-a348-e190e4d02feb
Payload:
{
  "assignment_type": "class_teacher | subject_teacher | assistant_teacher | substitute_teacher",
  "is_primary": true,
  "subject": "Mathematics"
}

Add Homework
Post Call
http://localhost:3000/api/homework
Payload:
{
    "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
    "subject": "Mathematics",
    "title": "Addition and Subtraction Practice",
    "description": "Complete exercises 1-20 in Chapter 3. Show all your work and submit by the due date.",
    "due_date": "2025-07-30T23:59:59Z"
}
Response:
{
    "status": "success",
    "data": {
        "homework": {
            "id": "1748d306-3092-47f8-ada4-dd5a3284e60d",
            "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
            "subject": "Mathematics",
            "title": "Addition and Subtraction Practice",
            "description": "Complete exercises 1-20 in Chapter 3. Show all your work and submit by the due date.",
            "due_date": "2025-07-30T23:59:59+00:00",
            "created_at": "2025-07-26T13:19:45.031841+00:00"
        }
    }
}

Create Classwork
Post Call
http://localhost:3000/api/classwork
Payload:
{
  "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
  "subject": "Mathematics",
  "summary": "Today we covered basic addition and subtraction",
  "topics_covered": ["Addition", "Subtraction", "Number Line"],
  "date": "2025-07-29",
  "is_shared_with_parents": true
}
Response:
{
    "status": "success",
    "data": {
        "classwork": {
            "id": "7e9f7e35-368a-426a-b75a-0b9d7b44e05f",
            "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
            "subject": "Mathematics",
            "summary": "Today we covered basic addition and subtraction",
            "topics_covered": [
                "Addition",
                "Subtraction",
                "Number Line"
            ],
            "date": "2025-07-29",
            "is_shared_with_parents": true,
            "created_at": "2025-07-29T12:35:01.649659+00:00",
            "updated_at": "2025-07-29T12:35:01.649659+00:00"
        }
    }
}

Update classwork
Put Call
http://localhost:3000/api/classwork/7e9f7e35-368a-426a-b75a-0b9d7b44e05f
Payload:
{
  "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
  "subject": "Mathematics",
  "summary": "Today we covered basic addition and subtraction",
  "topics_covered": ["Addition", "Subtraction", "Number Line"],
  "date": "2025-07-29",
  "is_shared_with_parents": true
}

Delete Classwork
Delete call
http://localhost:3000/api/classwork/7e9f7e35-368a-426a-b75a-0b9d7b44e05f

Get Classwork (Parent/Teacher)
Get Call
http://localhost:3000/api/classwork?page=1&limit=20
With Filters: class division
http://localhost:3000/api/classwork?page=1&limit=20&class_division_id=4ded8472-fe26-4cf3-ad25-23f601960a0b
(Class division, subject and date range)
http://localhost:3000/api/classwork?page=1&limit=20&class_division_id=4ded8472-fe26-4cf3-ad25-23f601960a0b&subject=Mathematics&date_from=2025-07-25&date_to=2025-07-29
Response:
{
    "status": "success",
    "data": {
        "classwork": [
            {
                "id": "7e9f7e35-368a-426a-b75a-0b9d7b44e05f",
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "subject": "Mathematics",
                "summary": "Today we covered basic addition and subtraction",
                "topics_covered": [
                    "Addition",
                    "Subtraction",
                    "Number Line"
                ],
                "date": "2025-07-29",
                "is_shared_with_parents": true,
                "created_at": "2025-07-29T12:35:01.649659+00:00",
                "updated_at": "2025-07-29T12:35:01.649659+00:00",
                "teacher": {
                    "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                    "full_name": "Teacher 1"
                },
                "class_division": {
                    "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                    "level": {
                        "name": "Grade 1",
                        "sequence_number": 1
                    },
                    "division": "A"
                },
                "attachments": [],
                "topics": [
                    {
                        "id": "d41fa4f3-2c55-4bca-bfa0-34576d300313",
                        "topic_name": "Addition",
                        "topic_description": null
                    },
                    {
                        "id": "b94de071-3bed-47cf-abbf-429cad1183f9",
                        "topic_name": "Subtraction",
                        "topic_description": null
                    },
                    {
                        "id": "485ec2f8-32e6-4e08-bddd-b84151291b90",
                        "topic_name": "Number Line",
                        "topic_description": null
                    }
                ]
            }
        ],
        "count": 1,
        "total_count": 1,
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 1,
            "total_pages": 1,
            "has_next": false,
            "has_prev": false
        }
    }
}

Get the homework with filters (Teacher/Parent)
Get Call
http://localhost:3000/api/homework?subject=Mathematics&status=upcoming
*Query Parameters:**

- `class_division_id`: Filter by class division ID
- `subject`: Filter by subject
- `teacher_id`: Filter by teacher ID (admin/principal only)
- `academic_year_id`: Filter by academic year
- `class_level_id`: Filter by class level (Grade 1, Grade 2, etc.)
- `due_date_from`: Filter homework due from this date
- `due_date_to`: Filter homework due until this date
- `status`: Filter by status (`overdue`, `upcoming`)
- `page`: Page number for pagination (default: 1)
- `limit`: Number of items per page (default: 20, max: 100)
Response:
{
    "status": "success",
    "data": {
        "homework": [
            {
                "id": "1748d306-3092-47f8-ada4-dd5a3284e60d",
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "subject": "Mathematics",
                "title": "Addition and Subtraction Practice",
                "description": "Complete exercises 1-20 in Chapter 3. Show all your work and submit by the due date.",
                "due_date": "2025-07-30T23:59:59+00:00",
                "created_at": "2025-07-26T13:19:45.031841+00:00",
                "teacher": {
                    "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                    "full_name": "Teacher 1"
                },
                "class_division": {
                    "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                    "level": {
                        "name": "Grade 1",
                        "sequence_number": 1
                    },
                    "division": "A"
                },
                "attachments": []
            }
        ]
    }
}

Get Students by class division
Get Call
http://localhost:3000/api/students/class/4ded8472-fe26-4cf3-ad25-23f601960a0b
Response:
{
    "status": "success",
    "data": {
        "class_division": {
            "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "division": "A",
            "level": {
                "name": "Grade 1",
                "sequence_number": 1
            },
            "teacher": {
                "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "full_name": "Teacher 1"
            }
        },
        "students": [
            {
                "id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                "full_name": "Student 1",
                "admission_number": "2025001",
                "date_of_birth": "2018-05-15",
                "status": "active",
                "student_academic_records": [
                    {
                        "id": "5b1585ce-0884-4bd7-9f40-96fb0c86c917",
                        "status": "ongoing",
                        "roll_number": "01",
                        "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b"
                    }
                ]
            }
        ],
        "count": 3
    }
}

Get All divisions available
Get Call
http://school-app-backend-d143b785b631.herokuapp.com/api/academic/class-divisions
Response:
{
    "status": "success",
    "data": {
        "class_divisions": [
            {
                "id": "d5e2c45b-bce9-45c2-bb4e-caa6add083e1",
                "academic_year_id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                "class_level_id": "36bb861b-eed6-4038-8ad4-524441cde543",
                "division": "B",
                "teacher_id": null,
                "created_at": "2025-07-25T07:51:19.778894+00:00",
                "academic_year": {
                    "year_name": "2025-2026"
                },
                "class_level": {
                    "name": "Grade 1",
                    "sequence_number": 1
                },
                "teacher": null
            },
            {
                "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "academic_year_id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                "class_level_id": "36bb861b-eed6-4038-8ad4-524441cde543",
                "division": "A",
                "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "created_at": "2025-07-25T07:49:37.097542+00:00",
                "academic_year": {
                    "year_name": "2025-2026"
                },
                "class_level": {
                    "name": "Grade 1",
                    "sequence_number": 1
                },
                "teacher": {
                    "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                    "full_name": "Teacher 1"
                }
            }
        ]
    }
}

Get All Teacher
Get Call
http://school-app-backend-d143b785b631.herokuapp.com/api/academic/teachers
Response:
{
    "status": "success",
    "data": {
        "teachers": [
            {
                "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "user_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "staff_id": "0a7baedb-09a5-4453-b80b-e186f8b69469",
                "full_name": "Teacher 1",
                "phone_number": "1234567893",
                "email": null,
                "department": "Teaching",
                "designation": "Teacher",
                "is_active": true
            }
        "total": 7,
        "message": "Use teacher_id for class division assignments"
    }
}

Get Teacher assigned to a class division
Get Call
http://school-app-backend-d143b785b631.herokuapp.com/api/academic/class-divisions/4ded8472-fe26-4cf3-ad25-23f601960a0b/teacher
Response:
{
    "status": "success",
    "data": {
        "class_division": {
            "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "division": "A",
            "class_name": "Grade 1 A",
            "academic_year": "2025-2026",
            "sequence_number": 1
        },
        "teacher": {
            "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
            "user_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
            "staff_id": "0a7baedb-09a5-4453-b80b-e186f8b69469",
            "full_name": "Teacher 1",
            "phone_number": "1234567893",
            "email": null,
            "department": "Teaching",
            "designation": "Teacher"
        },
        "is_assigned": true
    }
}

Get Current User For Teacher
Get Call
http://school-app-backend-d143b785b631.herokuapp.com/api/academic/my-teacher-id
Response:
{
    "status": "success",
    "data": {
        "user_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
        "staff_id": "0a7baedb-09a5-4453-b80b-e186f8b69469",
        "full_name": "Teacher 1",
        "staff_info": {
            "id": "0a7baedb-09a5-4453-b80b-e186f8b69469",
            "department": "Teaching",
            "designation": "Teacher"
        },
        "assignment_ids": {
            "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
            "staff_id": "0a7baedb-09a5-4453-b80b-e186f8b69469"
        },
        "assigned_classes": [
            {
                "assignment_id": "a7c70452-7295-44da-a348-e190e4d02feb",
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "division": "A",
                "class_name": "Grade 1 A",
                "class_level": "Grade 1",
                "sequence_number": 1,
                "academic_year": "2025-2026",
                "assignment_type": "class_teacher",
                "subject": "Mathematics",
                "is_primary": true,
                "assigned_date": "2025-07-25T07:49:37.097542+00:00"
            }
        ],
        "primary_classes": [
            {
                "assignment_id": "a7c70452-7295-44da-a348-e190e4d02feb",
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "division": "A",
                "class_name": "Grade 1 A",
                "class_level": "Grade 1",
                "sequence_number": 1,
                "academic_year": "2025-2026",
                "assignment_type": "class_teacher",
                "subject": "Mathematics",
                "is_primary": true,
                "assigned_date": "2025-07-25T07:49:37.097542+00:00"
            }
        ],
        "secondary_classes": [],
        "total_assigned_classes": 1,
        "total_primary_classes": 1,
        "total_secondary_classes": 0,
        "has_assignments": true,
        "using_legacy_data": false,
        "assignment_summary": {
            "primary_teacher_for": 1,
            "subject_teacher_for": 0,
            "assistant_teacher_for": 0,
            "substitute_teacher_for": 0
        },
        "subjects_taught": []
    }
}




Get All the Classes for a teacher
Get Call
https://school-app-backend-d143b785b631.herokuapp.com/api/academic/teachers/df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51/classes
Response:
{
    "status": "success",
    "data": {
        "teacher": {
            "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
            "full_name": "Teacher 1"
        },
        "assignments": [
            {
                "assignment_id": "a7c70452-7295-44da-a348-e190e4d02feb",
                "assignment_type": "class_teacher",
                "is_primary": true,
                "assigned_date": "2025-07-25T07:49:37.097542+00:00",
                "class_info": {
                    "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                    "division": "A",
                    "class_name": "Grade 1 A",
                    "class_level": "Grade 1",
                    "sequence_number": 1,
                    "academic_year": "2025-2026"
                }
            }
        ],
        "primary_classes": [
            {
                "assignment_id": "a7c70452-7295-44da-a348-e190e4d02feb",
                "assignment_type": "class_teacher",
                "is_primary": true,
                "assigned_date": "2025-07-25T07:49:37.097542+00:00",
                "class_info": {
                    "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                    "division": "A",
                    "class_name": "Grade 1 A",
                    "class_level": "Grade 1",
                    "sequence_number": 1,
                    "academic_year": "2025-2026"
                }
            }
        ],
        "total_assignments": 1,
        "has_assignments": true
    }
}


Get All Teachers for a class
Get Call
https://school-app-backend-d143b785b631.herokuapp.com/api/academic/class-divisions/4ded8472-fe26-4cf3-ad25-23f601960a0b/teachers
Response:
{
    "status": "success",
    "data": {
        "class_division": {
            "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "division": "A",
            "class_name": "Grade 1 A",
            "academic_year": "2025-2026",
            "sequence_number": 1
        },
        "teachers": [
            {
                "assignment_id": "a7c70452-7295-44da-a348-e190e4d02feb",
                "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "assignment_type": "class_teacher",
                "subject": null,
                "is_primary": true,
                "assigned_date": "2025-07-25T07:49:37.097542+00:00",
                "is_active": true,
                "teacher_info": {
                    "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                    "full_name": "Teacher 1",
                    "phone_number": "1234567893",
                    "email": null,
                    "staff_id": "0a7baedb-09a5-4453-b80b-e186f8b69469",
                    "department": "Teaching",
                    "designation": "Teacher"
                }
            }
        ],
        "primary_teacher": {
            "assignment_id": "a7c70452-7295-44da-a348-e190e4d02feb",
            "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
            "assignment_type": "class_teacher",
            "subject": null,
            "is_primary": true,
            "assigned_date": "2025-07-25T07:49:37.097542+00:00",
            "is_active": true,
            "teacher_info": {
                "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "full_name": "Teacher 1",
                "phone_number": "1234567893",
                "email": null,
                "staff_id": "0a7baedb-09a5-4453-b80b-e186f8b69469",
                "department": "Teaching",
                "designation": "Teacher"
            }
        },
        "total_teachers": 1,
        "has_teachers": true,
        "using_legacy_data": false
    }
}


Get Class Division Details
Get Call
https://school-app-backend-d143b785b631.herokuapp.com/api/students/class/4ded8472-fe26-4cf3-ad25-23f601960a0b/details
Response:
{
    "status": "success",
    "data": {
        "class_division": {
            "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "division": "A",
            "class_level": {
                "id": "36bb861b-eed6-4038-8ad4-524441cde543",
                "name": "Grade 1",
                "sequence_number": 1
            },
            "academic_year": {
                "id": "f6905bae-23b4-45fc-bcf2-4bb19beee945",
                "year_name": "2025-2026"
            }
        },
        "principal": {
            "id": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
            "full_name": "Principal 1"
        },
        "teachers": [
            {
                "assignment_id": "a7c70452-7295-44da-a348-e190e4d02feb",
                "teacher_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "assignment_type": "class_teacher",
                "subject": null,
                "is_primary": true,
                "assigned_date": "2025-07-25T07:49:37.097542+00:00",
                "is_active": true,
                "teacher_info": {
                    "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                    "full_name": "Teacher 1",
                    "phone_number": "1234567893",
                    "email": null
                }
            }
        ],
        "students": [
            {
                "id": "753e2981-52fb-4031-b963-d309ed8f1f95",
                "full_name": "Shubham",
                "admission_number": "STU2025263",
                "date_of_birth": "1999-03-31",
                "status": "active",
                "student_academic_records": [
                    {
                        "id": "9e539499-aab3-40d9-ac04-8ac77fea2a98",
                        "status": "ongoing",
                        "roll_number": "123",
                        "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b"
                    }
                ]
            }
        ]
    }
}





Messages
Add Message(Teacher)
Post Call
http://localhost:3000/api/messages
PayLoad:
{
    "content": "Message content From Teacher",
    "type": "group",
    "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b", // Optional - for class-specific messages
    "recipient_id": "uuid" // Optional - for individual messages
}
Response:
{
    "status": "success",
    "data": {
        "message": {
            "id": "f727f35d-1ca1-484c-bda2-95b6321c1106",
            "sender_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
            "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "recipient_id": null,
            "content": "Message content From Teacher",
            "type": "group",
            "status": "pending",
            "created_at": "2025-07-30T08:29:19.653642+00:00",
            "updated_at": "2025-07-30T08:29:19.653642+00:00"
        }
    }
}

Get Messages (Principal)
Get Call
http://localhost:3000/api/messages
Response:
{
    "status": "success",
    "data": {
        "messages": [
            {
                "id": "f727f35d-1ca1-484c-bda2-95b6321c1106",
                "sender_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "recipient_id": null,
                "content": "Message content From Teacher",
                "type": "group",
                "status": "pending",
                "created_at": "2025-07-30T08:29:19.653642+00:00",
                "updated_at": "2025-07-30T08:29:19.653642+00:00",
                "sender": {
                    "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                    "role": "teacher",
                    "full_name": "Teacher 1"
                },
                "recipient": null,
                "class": null
            }
        ]
    }
}

Get Message (Teacher)
Get Call
http://localhost:3000/api/messages
Response:
{
    "status": "success",
    "data": {
        "messages": [
            {
                "id": "f727f35d-1ca1-484c-bda2-95b6321c1106",
                "sender_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
                "recipient_id": null,
                "content": "Message content From Teacher",
                "type": "group",
                "status": "pending",
                "created_at": "2025-07-30T08:29:19.653642+00:00",
                "updated_at": "2025-07-30T08:29:19.653642+00:00",
                "sender": {
                    "id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                    "role": "teacher",
                    "full_name": "Teacher 1"
                },
                "recipient": null,
                "class": null
            }
        ]
    }
}

Approve Message (Principal)
Put Call
http://localhost:3000/api/messages/f727f35d-1ca1-484c-bda2-95b6321c1106/approve
Response:
{
    "status": "success",
    "data": {
        "message": {
            "id": "f727f35d-1ca1-484c-bda2-95b6321c1106",
            "sender_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
            "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "recipient_id": null,
            "content": "Message content From Teacher",
            "type": "group",
            "status": "approved",
            "created_at": "2025-07-30T08:29:19.653642+00:00",
            "updated_at": "2025-07-30T09:59:33.062646+00:00",
            "approved_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6"
        }
    }
}






Birthday Management
Get Today’s Birthday
Get Call
http://localhost:3000/api/birthdays/today
With filter:
http://localhost:3000/api/birthdays/today?class_division_id=4ded8472-fe26-4cf3-ad25-23f601960a0b
Response:
{
    "status": "success",
    "data": {
        "birthdays": [
            {
                "id": "efe24e05-db0b-47b6-9a63-4cc3df0ce546",
                "full_name": "Student 2",
                "date_of_birth": "2018-07-29",
                "admission_number": "2025002",
                "status": "active",
                "student_academic_records": [
                    {
                        "roll_number": "02",
                        "class_division": {
                            "level": {
                                "name": "Grade 1",
                                "sequence_number": 1
                            },
                            "division": "A"
                        }
                    }
                ]
            }
        ],
        "count": 1,
        "date": "2025-07-29"
    }
}

Upcoming birthdays
Get Call
http://localhost:3000/api/birthdays/upcoming
With filter
http://localhost:3000/api/birthdays/upcoming?class_division_id=4ded8472-fe26-4cf3-ad25-23f601960a0b
Response:
{
    "status": "success",
    "data": {
        "upcoming_birthdays": [
            {
                "date": "2025-07-29",
                "students": [
                    {
                        "id": "efe24e05-db0b-47b6-9a63-4cc3df0ce546",
                        "full_name": "Student 2",
                        "date_of_birth": "2018-07-29",
                        "admission_number": "2025002",
                        "status": "active",
                        "student_academic_records": [
                            {
                                "roll_number": "02",
                                "class_division": {
                                    "level": {
                                        "name": "Grade 1",
                                        "sequence_number": 1
                                    },
                                    "division": "A"
                                }
                            }
                        ]
                    }
                ],
                "count": 1
            },
            {
                "date": "2025-08-03",
                "students": [
                    {
                        "id": "0dc06d0b-2295-431e-9dfb-7fd3bff6bcc8",
                        "full_name": "Student 3",
                        "date_of_birth": "2018-08-03",
                        "admission_number": "2025003",
                        "status": "active",
                        "student_academic_records": [
                            {
                                "roll_number": "03",
                                "class_division": {
                                    "level": {
                                        "name": "Grade 1",
                                        "sequence_number": 1
                                    },
                                    "division": "A"
                                }
                            }
                        ]
                    }
                ],
                "count": 1
            }
        ],
        "total_count": 2
    }
}

Birthday Stats
Get Call
http://localhost:3000/api/birthdays/statistics
Response:
{
    "status": "success",
    "data": {
        "monthly_statistics": [
            {
                "month": 7,
                "month_name": "July",
                "count": 1
            },
            {
                "month": 8,
                "month_name": "August",
                "count": 1
            }
        ],
        "today_count": 0,
        "total_active_students": 3
    }
}

Get Class Birthdays Count (Teacher)
Get Call
http://localhost:3000/api/birthdays/class/4ded8472-fe26-4cf3-ad25-23f601960a0b
Response:
{
    "status": "success",
    "data": {
        "class_birthdays": [],
        "count": 0,
        "date": "2025-07-31"
    }
}

Get Class Birthdays (Admin/ Principal/ Teacher)
Get Call
http://localhost:3000/api/birthdays/division/4ded8472-fe26-4cf3-ad25-23f601960a0b
http://localhost:3000/api/birthdays/division/4ded8472-fe26-4cf3-ad25-23f601960a0b?date=2024-01-15
http://localhost:3000/api/birthdays/division/4ded8472-fe26-4cf3-ad25-23f601960a0b?start_date=2024-01-01&end_date=2024-01-31

Response:
{
    "status": "success",
    "data": {
        "class_division": {
            "id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "division": "A",
            "level": {
                "name": "Grade 1",
                "sequence_number": 1
            }
        },
        "birthdays": [],
        "count": 0,
        "total_count": 0,
        "date": "2025-07-31",
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 0,
            "total_pages": 0,
            "has_next": false,
            "has_prev": false
        }
    }
}

Get Birthdays for the teacher (Including all classes as subject teacher and class teacher)
Get Call
(today)
http://school-app-backend-d143b785b631.herokuapp.com/api/birthdays/my-classes
http://localhost:3000/api/birthdays/my-classes?date=2024-01-15
http://localhost:3000/api/birthdays/my-classes?start_date=2024-01-01&end_date=2024-01-31
Response:
{
    "status": "success",
    "data": {
        "birthdays": [],
        "count": 0,
        "total_count": 0,
        "date": "2025-08-19",
        "class_division_ids": [
            "4ded8472-fe26-4cf3-ad25-23f601960a0b"
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 0,
            "total_pages": 0,
            "has_next": false,
            "has_prev": false
        }
    }
}




Calendar Events
Create
http://localhost:3000/api/calendar/events
(Event types: `general`, `academic`, `sports`, `cultural`, `holiday`, `exam`, `meeting`, `other`)
PayLoad (School wide events):
{
  "title": "Event title 1",
  "description": "Event description",
  "event_date": "2025-08-08T00:00:00Z",
  "event_type": "school_wide",
  "is_single_day": true,
  "start_time": "09:00:00",
  "end_time": "10:00:00",
  "event_category": "holiday",
  "timezone": "Asia/Kolkata"
}

Payload (Class specific): teacher access
{
  "title": "Event title 1",
  "description": "Event description",
  "event_date": "2025-08-08T00:00:00Z",
  "event_type": "class_specific",
  "is_single_day": true,
  "start_time": "09:00:00",
   "class_division_id": "uuid",
  "end_time": "10:00:00",
  "event_category": "holiday",
  "timezone": "Asia/Kolkata"
}

PayLoad (Teacher specific event)
{
  "title": "Event title 1",
  "description": "Event description",
  "event_date": "2025-08-08T00:00:00Z",
  "event_type": "teacher_specific",
  "is_single_day": true,
  "start_time": "09:00:00",
  "end_time": "10:00:00",
  "event_category": "holiday",
  "timezone": "Asia/Kolkata"
}

Response:
{
    "status": "success",
    "data": {
        "event": {
            "id": "5f03c118-ef00-4f12-834f-892b3abca251",
            "title": "Event title 1",
            "description": "Event description",
            "event_date": "2025-08-07T18:30:00+00:00",
            "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
            "created_at": "2025-07-31T10:25:10.469197+00:00",
            "event_type": "school_wide",
            "class_division_id": null,
            "is_single_day": true,
            "start_time": "09:00:00",
            "end_time": "10:00:00",
            "timezone": "Asia/Kolkata",
            "event_category": "holiday"
        }
    }
}

Get Events
Get Call
http://localhost:3000/api/calendar/events (admin/principal)
Response:
{
    "status": "success",
    "data": {
        "events": [
            {
                "id": "5f03c118-ef00-4f12-834f-892b3abca251",
                "title": "Event title 1",
                "description": "Event description",
                "event_date": "2025-08-07T18:30:00+00:00",
                "event_date_ist": "2025-08-07T13:00:00+00:00",
                "start_time": "09:00:00",
                "end_time": "10:00:00",
                "is_single_day": true,
                "event_type": "school_wide",
                "event_category": "holiday",
                "class_division_id": null,
                "timezone": "Asia/Kolkata",
                "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                "created_at": "2025-07-31T10:25:10.469197+00:00",
                "creator_name": "Principal 1",
                "creator_role": "principal",
                "class_info": null
            }
        ]
    }
}

Get event By Id
Get Call
http://localhost:3000/api/calendar/events/5f03c118-ef00-4f12-834f-892b3abca251
Response:
{
    "status": "success",
    "data": {
        "event": {
            "id": "5f03c118-ef00-4f12-834f-892b3abca251",
            "title": "Event title 1",
            "description": "Event description",
            "event_date": "2025-08-07T18:30:00+00:00",
            "event_date_ist": "2025-08-07T13:00:00+00:00",
            "start_time": "09:00:00",
            "end_time": "10:00:00",
            "is_single_day": true,
            "event_type": "school_wide",
            "event_category": "holiday",
            "class_division_id": null,
            "timezone": "Asia/Kolkata",
            "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
            "created_at": "2025-07-31T10:25:10.469197+00:00",
            "creator_name": "Principal 1",
            "creator_role": "principal",
            "class_info": null
        }
    }
}

Edit Event
Put Call
http://localhost:3000/api/calendar/events/5f03c118-ef00-4f12-834f-892b3abca251
Response:
{
    "status": "success",
    "data": {
        "event": {
            "id": "5f03c118-ef00-4f12-834f-892b3abca251",
            "title": "Event title 1",
            "description": "Event description",
            "event_date": "2025-08-07T18:30:00+00:00",
            "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
            "created_at": "2025-07-31T10:25:10.469197+00:00",
            "event_type": "school_wide",
            "class_division_id": null,
            "is_single_day": true,
            "start_time": "00:00:00",
            "end_time": "23:59:00",
            "timezone": "Asia/Kolkata",
            "event_category": "holiday"
        }
    }
}

Delete Event
Delete Call
http://localhost:3000/api/calendar/events/5f03c118-ef00-4f12-834f-892b3abca251


Get Events for a class
Get Call
http://localhost:3000/api/calendar/events/class/4ded8472-fe26-4cf3-ad25-23f601960a0b


Get Events for a parent
http://localhost:3000/api/calendar/events/parent
Response:
{
    "status": "success",
    "data": {
        "events": [
            {
                "id": "5f03c118-ef00-4f12-834f-892b3abca251",
                "title": "Event title 1",
                "description": "Event description",
                "event_date": "2025-08-07T18:30:00+00:00",
                "event_date_ist": "2025-08-07T13:00:00+00:00",
                "event_type": "school_wide",
                "class_division_id": null,
                "is_single_day": true,
                "start_time": "00:00:00",
                "end_time": "23:59:00",
                "event_category": "holiday",
                "timezone": "Asia/Kolkata",
                "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                "created_at": "2025-07-31T10:25:10.469197+00:00",
                "creator_name": "Principal 1",
                "creator_role": "principal",
                "class_division": null,
                "class_level": null,
                "academic_year": null
            }
        ],
        "child_classes": []
    }
}

Approve
POST https://ajws-school-ba8ae5e3f955.herokuapp.com/api/calendar/events/{event_id}/approve

Reject
Post
https://ajws-school-ba8ae5e3f955.herokuapp.com/api/calendar/events/{event_id}/reject
Payload:
{
    "rejection_reason": "Event conflicts with existing schedule"
}



Leave Request
Create Leave Request
Post Call
http://localhost:3000/api/leave-requests
Payload:
{
  "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
  "start_date": "2025-07-31T00:00:00Z",
  "end_date": "2025-08-01T00:00:00Z",
  "reason": "Reason for leave"
}
Response:
{
    "status": "success",
    "data": {
        "leave_request": {
            "id": "7cd297b8-f333-44a3-beb9-919c94f58698",
            "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
            "start_date": "2025-07-31T00:00:00+00:00",
            "end_date": "2025-08-01T00:00:00+00:00",
            "reason": "Reason for leave",
            "status": "pending",
            "reviewed_by": null,
            "created_at": "2025-07-31T11:39:49.384622+00:00",
            "updated_at": "2025-07-31T11:39:49.384622+00:00"
        }
    }
}

Approve/ Reject Request (Teacher/ admin/ principal)
Put Call
http://localhost:3000/api/leave-requests/7cd297b8-f333-44a3-beb9-919c94f58698/status
PayLoad:
{
    "status": "approved" | "rejected"
}
Response:
{
    "status": "success",
    "data": {
        "leave_request": {
            "id": "7cd297b8-f333-44a3-beb9-919c94f58698",
            "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
            "start_date": "2025-07-31T00:00:00+00:00",
            "end_date": "2025-08-01T00:00:00+00:00",
            "reason": "Reason for leave",
            "status": "approved",
            "reviewed_by": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
            "created_at": "2025-07-31T11:39:49.384622+00:00",
            "updated_at": "2025-07-31T12:02:58.956954+00:00"
        }
    }
}

Get Requests With filtering
Get Call
http://localhost:3000/api/leave-requests
http://localhost:3000/api/leave-requests?status=pending
(status: pending, approved, rejected)
Response:
{
    "status": "success",
    "data": {
        "leave_requests": [
            {
                "id": "7cd297b8-f333-44a3-beb9-919c94f58698",
                "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                "start_date": "2025-07-31T00:00:00+00:00",
                "end_date": "2025-08-01T00:00:00+00:00",
                "reason": "Reason for leave",
                "status": "approved",
                "reviewed_by": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "created_at": "2025-07-31T11:39:49.384622+00:00",
                "updated_at": "2025-07-31T12:02:58.956954+00:00",
                "student": {
                    "id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                    "full_name": "Student 1",
                    "admission_number": "2025001"
                }
            }
        ]
    }
}

Get Requests by date range (Admin)
Get Call
http://localhost:3000/api/leave-requests?status=approved&from_date=2025-01-01&to_date=2025-01-31&student_id=123e4567-e89b-12d3-a456-426614174000&class_division_id=456e7890-e89b-12d3-a456-426614174000/api/l
eave-requests?status=approved&from_date=2025-01-01&to_date=2025-01-31&student_id=123e4567-e89b-12d3-a456-426614174000&class_division_id=456e7890-e89b-12d3-a456-4266141740/api/leave-requests?status=approved&from_date=2025-01-01&to_date=2025-01-31&student_id=123e4567-e89b-12d3-a456-426614174000&class_division_id=456e7890-e89b-12d3-a456-426614174000
Get leave requests (Parent) with filters
Get Call
http://localhost:3000/api/leave-requests/my-children?status=approved&student_id=123e4567-e89b-12d3-a456-426614174000&from_date=2024-01-01
Response:
{
    "status": "success",
    "data": {
        "leave_requests": [
            {
                "id": "7cd297b8-f333-44a3-beb9-919c94f58698",
                "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                "start_date": "2025-07-31T00:00:00+00:00",
                "end_date": "2025-08-01T00:00:00+00:00",
                "reason": "Reason for leave",
                "status": "approved",
                "reviewed_by": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "created_at": "2025-07-31T11:39:49.384622+00:00",
                "updated_at": "2025-07-31T12:02:58.956954+00:00",
                "student": {
                    "id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                    "full_name": "Student 1",
                    "admission_number": "2025001",
                    "date_of_birth": "2018-05-15",
                    "student_academic_records": [
                        {
                            "roll_number": "01",
                            "class_division": {
                                "level": {
                                    "name": "Grade 1",
                                    "sequence_number": 1
                                },
                                "division": "A"
                            }
                        }
                    ]
                }
            }
        ],
        "leave_requests_by_student": {
            "d2e4585e-830c-40ba-b29c-cc62ff146607": {
                "student": {
                    "id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                    "full_name": "Student 1",
                    "admission_number": "2025001",
                    "date_of_birth": "2018-05-15",
                    "student_academic_records": [
                        {
                            "roll_number": "01",
                            "class_division": {
                                "level": {
                                    "name": "Grade 1",
                                    "sequence_number": 1
                                },
                                "division": "A"
                            }
                        }
                    ]
                },
                "leave_requests": [
                    {
                        "id": "7cd297b8-f333-44a3-beb9-919c94f58698",
                        "student_id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                        "start_date": "2025-07-31T00:00:00+00:00",
                        "end_date": "2025-08-01T00:00:00+00:00",
                        "reason": "Reason for leave",
                        "status": "approved",
                        "reviewed_by": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                        "created_at": "2025-07-31T11:39:49.384622+00:00",
                        "updated_at": "2025-07-31T12:02:58.956954+00:00",
                        "student": {
                            "id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                            "full_name": "Student 1",
                            "admission_number": "2025001",
                            "date_of_birth": "2018-05-15",
                            "student_academic_records": [
                                {
                                    "roll_number": "01",
                                    "class_division": {
                                        "level": {
                                            "name": "Grade 1",
                                            "sequence_number": 1
                                        },
                                        "division": "A"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        "children": [
            {
                "id": "d2e4585e-830c-40ba-b29c-cc62ff146607",
                "name": "Student 1",
                "admission_number": "2025001",
                "class_info": {
                    "level": {
                        "name": "Grade 1",
                        "sequence_number": 1
                    },
                    "division": "A"
                }
            }
        ],
        "count": 1,
        "total_count": 1,
        "filters": {
            "status": null,
            "student_id": null,
            "from_date": null,
            "to_date": null
        },
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 1,
            "total_pages": 1,
            "has_next": false,
            "has_prev": false
        }
    }
}

Alerts
Create (Admin/ Principal)
Post Call 
http://localhost:3000/api/alerts
PayLoad:
{
  "title": "Alert Title 1",
  "content": "Alert message content 1",
  "alert_type": "general",
  "recipient_type": "all",
  "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b" // Optional - for class-specific alerts
}
Response:
{
    "status": "success",
    "data": {
        "message": "Alert created successfully",
        "alert": {
            "id": "06244b10-8921-4313-909f-65aaf6ca5202",
            "title": "Alert Title 1",
            "content": "Alert message content 1",
            "alert_type": "general",
            "sender_id": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
            "status": "draft",
            "approved_by": null,
            "approved_at": null,
            "sent_at": null,
            "created_at": "2025-07-31T13:31:19.445765+00:00",
            "updated_at": "2025-07-31T13:31:19.445765+00:00"
        }
    }
}

Get Alert With filter
Get Call
http://localhost:3000/api/alerts
http://localhost:3000/api/alerts?status=approved&page=1&limit=10
(Status: approved, rejected, sent)
Response:
{
    "status": "success",
    "data": {
        "alerts": [
            {
                "id": "13b4b331-7f11-4eec-a3ee-3ffe10e8108b",
                "title": "Alert Title 2",
                "content": "Alert message content 2",
                "alert_type": "important",
                "sender_id": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                "status": "approved",
                "approved_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                "approved_at": "2025-07-31T13:40:05.668+00:00",
                "sent_at": null,
                "created_at": "2025-07-31T13:40:06.082125+00:00",
                "updated_at": "2025-07-31T13:40:06.082125+00:00"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 10,
            "total": 2,
            "total_pages": 1
        }
    }
}

Reject the Alert(Principal)
Put Call
http://localhost:3000/api/alerts/13b4b331-7f11-4eec-a3ee-3ffe10e8108b/reject
Payload:
{
  "rejection_reason": "Reason for rejection"
}
Send alert(Admin/ Principal)
Put Call
http://localhost:3000/api/alerts/13b4b331-7f11-4eec-a3ee-3ffe10e8108b/send
Response:
{
    "status": "success",
    "data": {
        "message": "Alert sent successfully",
        "alert": {
            "id": "13b4b331-7f11-4eec-a3ee-3ffe10e8108b",
            "title": "Alert Title 2",
            "content": "Alert message content 2",
            "alert_type": "important",
            "sender_id": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
            "status": "sent",
            "approved_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
            "approved_at": "2025-07-31T13:40:05.668+00:00",
            "sent_at": "2025-07-31T15:22:53.677+00:00",
            "created_at": "2025-07-31T13:40:06.082125+00:00",
            "updated_at": "2025-07-31T15:22:54.028678+00:00"
        }
    }
}

Chat
Create thread
Post Call
http://localhost:3000/api/chat/threads
Payload:
{
  "thread_type": "direct", (or group)
  "title": "Thread Title 1",
  "participants": ["2299de5c-63ff-4e60-8ae1-71600b29ba86"]
}
Response:
{
    "status": "success",
    "data": {
        "id": "d83df1d5-7bbd-445e-b872-6bb910cd84bb",
        "thread_type": "direct",
        "title": "Thread Title 1",
        "created_by": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
        "status": "active",
        "created_at": "2025-08-01T09:42:13.786703+00:00",
        "updated_at": "2025-08-01T09:42:13.786703+00:00"
    }
}

Send Message
Post Call
http://localhost:3000/api/chat/messages
Payload:
{
  "thread_id": "d83df1d5-7bbd-445e-b872-6bb910cd84bb",
  "content": "Message 1"
}
Response:
{
    "status": "success",
    "data": {
        "id": "30506a17-a8a2-4be7-a680-a9e921cae8a8",
        "thread_id": "d83df1d5-7bbd-445e-b872-6bb910cd84bb",
        "sender_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
        "content": "Message 1",
        "message_type": "text",
        "status": "sent",
        "moderated": false,
        "moderated_by": null,
        "moderated_at": null,
        "moderation_reason": null,
        "created_at": "2025-08-01T11:03:42.826664+00:00",
        "updated_at": "2025-08-01T11:03:42.826664+00:00",
        "sender": {
            "role": "teacher",
            "full_name": "Teacher 1"
        }
    }
}


Create and send messages
Post Call
http://localhost:3000/api/chat/start-conversation
Payload:
{
  "participants": ["2299de5c-63ff-4e60-8ae1-71600b29ba86"],
  "message_content": "Message - Hello!",
  "thread_type": "group",
  "title": "Chat with Parent 1"
}
Response:
{
    "status": "success",
    "data": {
        "thread": {
            "id": "af9d3caa-ea4a-4cca-bd4a-211e068b14b0",
            "thread_type": "group",
            "title": "Chat with Parent 1",
            "created_by": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
            "created_at": "2025-08-01T11:28:17.871396+00:00"
        },
        "message": {
            "id": "35d905d9-fcd4-4898-be57-030d62c454a0",
            "content": "Message - Hello!",
            "sender": {
                "role": "parent",
                "full_name": "Parent 1"
            },
            "created_at": "2025-08-01T11:28:17.977591+00:00"
        },
        "participants": 1
    }
}
Get Threads
Get Call
http://localhost:3000/api/chat/threads
Response:
{
    "status": "success",
    "data": {
        "threads": [
            {
                "id": "d83df1d5-7bbd-445e-b872-6bb910cd84bb",
                "thread_type": "direct",
                "title": "Thread Title 1",
                "created_by": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "status": "active",
                "created_at": "2025-08-01T09:42:13.786703+00:00",
                "updated_at": "2025-08-01T09:42:13.786703+00:00",
                "participants": [
                    {
                        "role": "member",
                        "user": {
                            "role": "parent",
                            "full_name": "Parent 1"
                        },
                        "user_id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
                        "last_read_at": null
                    },
                    {
                        "role": "admin",
                        "user": {
                            "role": "teacher",
                            "full_name": "Teacher 1"
                        },
                        "user_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                        "last_read_at": null
                    }
                ],
                "last_message": []
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 1,
            "total_pages": 1
        }
    }
}


Get Message from a thread
Get call
http://localhost:3000/api/chat/messages?thread_id=d83df1d5-7bbd-445e-b872-6bb910cd84bb
Response:
{
    "status": "success",
    "data": {
        "messages": [
            {
                "id": "30506a17-a8a2-4be7-a680-a9e921cae8a8",
                "thread_id": "d83df1d5-7bbd-445e-b872-6bb910cd84bb",
                "sender_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "content": "Message 1",
                "message_type": "text",
                "status": "sent",
                "moderated": false,
                "moderated_by": null,
                "moderated_at": null,
                "moderation_reason": null,
                "created_at": "2025-08-01T11:03:42.826664+00:00",
                "updated_at": "2025-08-01T11:03:42.826664+00:00",
                "sender": {
                    "role": "teacher",
                    "full_name": "Teacher 1"
                },
                "attachments": []
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 50,
            "total": 1,
            "total_pages": 1
        }
    }
}

Edit Message
Put Call
http://localhost:3000/api/chat/messages/55090437-ea03-46c6-998a-c27fe4331e6f
Payload:
{
  "content": "Message 2 - Hello"
}
Response:
{
    "status": "success",
    "data": {
        "id": "55090437-ea03-46c6-998a-c27fe4331e6f",
        "thread_id": "d83df1d5-7bbd-445e-b872-6bb910cd84bb",
        "sender_id": "2299de5c-63ff-4e60-8ae1-71600b29ba86",
        "content": "Message 2 - Hello",
        "message_type": "text",
        "status": "sent",
        "moderated": false,
        "moderated_by": null,
        "moderated_at": null,
        "moderation_reason": null,
        "created_at": "2025-08-01T11:07:09.259199+00:00",
        "updated_at": "2025-08-01T11:11:28.637823+00:00",
        "sender": {
            "role": "parent",
            "full_name": "Parent 1"
        }
    }
}

Delete Message
Delete Call
http://localhost:3000/api/chat/messages/62e8f381-b5ff-4f0a-9113-da70d491e061
Response:
{
    "status": "success",
    "message": "Message deleted successfully"
}

Add Participant to group message (message type: group)
Post Call
http://localhost:3000/api/chat/threads/af9d3caa-ea4a-4cca-bd4a-211e068b14b0/participants
PayLoad:
{
  "participant_ids": ["df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51"]
}
Response:
{
    "status": "success",
    "data": {
        "added": [
            {
                "id": "07522a70-659d-4473-975a-55bce64410e0",
                "thread_id": "af9d3caa-ea4a-4cca-bd4a-211e068b14b0",
                "user_id": "df07bb9f-4ffe-47f7-9a0d-5fc0e3896a51",
                "role": "member",
                "joined_at": "2025-08-01T11:42:10.273029+00:00",
                "last_read_at": null,
                "user": {
                    "role": "teacher",
                    "full_name": "Teacher 1"
                }
            }
        ],
        "total_added": 1,
        "already_participants": []
    }
}


List - Uniform
Create Uniform List
Post Call
http://localhost:3000/api/lists/uniforms
PayLoad:
{
  "name": "Summer Uniform",
  "description": "Light cotton uniform for summer",
  "grade_level": "Grade 1",
  "gender": "unisex",
  "season": "summer",
  "price": 500,
  "supplier": "School Supplies Co",
  "notes": "Available in multiple sizes",
  "is_required": true
}
Response:
{
    "status": "success",
    "data": {
        "id": "54cf71a8-57da-475d-a7ea-1c1e24711f1b",
        "name": "Summer Uniform",
        "description": "Light cotton uniform for summer",
        "grade_level": "Grade 1",
        "gender": "unisex",
        "season": "summer",
        "price": 500,
        "supplier": null,
        "notes": null,
        "is_required": true,
        "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
        "created_at": "2025-08-01T12:50:22.355488+00:00",
        "updated_at": "2025-08-01T12:50:22.355488+00:00"
    }
}

Get uniforms with filters
Get Call
http://localhost:3000/api/lists/uniforms
http://localhost:3000/api/lists/uniforms?page=1&limit=3&grade_level=Grade 1&gender=unisex&season=summer
Response:
{
    "status": "success",
    "data": {
        "uniforms": [
            {
                "id": "54cf71a8-57da-475d-a7ea-1c1e24711f1b",
                "name": "Summer Uniform",
                "description": "Light cotton uniform for summer",
                "grade_level": "Grade 1",
                "gender": "unisex",
                "season": "summer",
                "price": 500,
                "supplier": null,
                "notes": null,
                "is_required": true,
                "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                "created_at": "2025-08-01T12:50:22.355488+00:00",
                "updated_at": "2025-08-01T12:50:22.355488+00:00"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 1,
            "total_pages": 1
        }
    }
}

Update Uniform data
Put Call
http://localhost:3000/api/lists/uniforms/54cf71a8-57da-475d-a7ea-1c1e24711f1b
Payload:
{
"supplier": "Updated Supplier",
  "price": 550
}
Response:
{
    "status": "success",
    "data": {
        "id": "54cf71a8-57da-475d-a7ea-1c1e24711f1b",
        "name": "Summer Uniform",
        "description": "Light cotton uniform for summer",
        "grade_level": "Grade 1",
        "gender": "unisex",
        "season": "summer",
        "price": 550,
        "supplier": "Updated Supplier",
        "notes": null,
        "is_required": true,
        "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
        "created_at": "2025-08-01T12:50:22.355488+00:00",
        "updated_at": "2025-08-01T13:03:38.441442+00:00"
    }
}

Delete Uniform
Delete call
http://localhost:3000/api/lists/uniforms/bec5164e-e175-48c0-8844-f3cc8130f18c
Response:
{
    "status": "success",
    "message": "Uniform deleted successfully"
}

List - Books
Create Book List
Post Call
http://localhost:3000/api/lists/books
PayLoad:
{
  "title": "Mathematics Textbook",
  "author": "Author Name",
  "publisher": "Publisher Name",
  "subject": "Mathematics",
  "grade_level": "Grade 1",
  "isbn": "978-1234567890",
  "price": 250,
  "edition": "2024"
}
Response:
{
    "status": "success",
    "data": {
        "id": "5d7ab9e4-2949-44b5-be6d-ff62a7efaac4",
        "title": "Mathematics Textbook",
        "author": "Author Name",
        "publisher": "Publisher Name",
        "isbn": "978-1234567890",
        "grade_level": "Grade 1",
        "subject": "Mathematics",
        "edition": "2024",
        "price": 250,
        "supplier": null,
        "notes": null,
        "is_required": true,
        "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
        "created_at": "2025-08-02T05:46:33.899896+00:00",
        "updated_at": "2025-08-02T05:46:33.899896+00:00"
    }
}

Get books
Get Call
http://localhost:3000/api/lists/books
Response:
{
    "status": "success",
    "data": {
        "books": [
            {
                "id": "5d7ab9e4-2949-44b5-be6d-ff62a7efaac4",
                "title": "Mathematics Textbook",
                "author": "Author Name",
                "publisher": "Publisher Name",
                "isbn": "978-1234567890",
                "grade_level": "Grade 1",
                "subject": "Mathematics",
                "edition": "2024",
                "price": 250,
                "supplier": null,
                "notes": null,
                "is_required": true,
                "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
                "created_at": "2025-08-02T05:46:33.899896+00:00",
                "updated_at": "2025-08-02T05:46:33.899896+00:00"
            }
        ],
        "pagination": {
            "page": 1,
            "limit": 20,
            "total": 1,
            "total_pages": 1
        }
    }
}

Edit Book
Put Call
http://localhost:3000/api/lists/books/5d7ab9e4-2949-44b5-be6d-ff62a7efaac4
Payload:
{
  "price": 255,
  "edition": "2024"
}
Response:
{
    "status": "success",
    "data": {
        "id": "5d7ab9e4-2949-44b5-be6d-ff62a7efaac4",
        "title": "Mathematics Textbook",
        "author": "Author Name",
        "publisher": "Publisher Name",
        "isbn": "978-1234567890",
        "grade_level": "Grade 1",
        "subject": "Mathematics",
        "edition": "2024",
        "price": 255,
        "supplier": null,
        "notes": null,
        "is_required": true,
        "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
        "created_at": "2025-08-02T05:46:33.899896+00:00",
        "updated_at": "2025-08-02T05:51:01.918951+00:00"
    }
}

Delete Book
Delete Call
http://localhost:3000/api/lists/books/40341c03-fcfc-466c-9a9f-1d4caabfd124
Response:
{
    "status": "success",
    "message": "Book deleted successfully"
}

List - Staff
Create staff with user account
Post Call
http://localhost:3000/api/lists/staff/with-user
PayLoad:
{
  "full_name": "Teacher Name",
  "phone_number": "1234567890",
  "role": "teacher",
  "department": "Mathematics",
  "designation": "Senior Teacher",
  "password": "MyPassword123",
  "user_role": "teacher"
}

Create Staff
Post Call


Chat (Real Time ) - Web Sockets
Create a thread
Post Call
https://school-app-backend-d143b785b631.herokuapp.com/api/chat/start-conversation
PayLoad:
{
  "participants": ["2299de5c-63ff-4e60-8ae1-71600b29ba86"],
  "message_content": "Hello!",
  "thread_type": "direct" | ”group”,
  "title": "Teacher-Parent Discussion"
}
Response:
{
    "status": "success",
    "data": {
        "thread": {
            "id": "5ab97a62-440d-45d8-96dd-fdb8648c89da",
            "thread_type": "direct",
            "title": "Teacher-Parent Discussion",
            "created_by": "b9a49f00-a5ad-4824-852f-7ba46d5f09a6",
            "created_at": "2025-08-02T08:29:05.769909+00:00"
        },
        "message": {
            "id": "a1cc0223-4258-448b-84cc-95eeccb58083",
            "content": "Hello!",
            "sender": {
                "role": "principal",
                "full_name": "Principal 1"
            },
            "created_at": "2025-08-02T08:29:07.198874+00:00"
        },
        "participants": 2
    }
}

Connect
ws://school-app-backend-d143b785b631.herokuapp.com?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZjA3YmI5Zi00ZmZlLTQ3ZjctOWEwZC01ZmMwZTM4OTZhNTEiLCJyb2xlIjoidGVhY2hlciIsImlhdCI6MTc1NDEyMTkyNCwiZXhwIjoxNzU0MjA4MzI0fQ.jvBhz1Fg3FV8-ja89PkUOj_rCYPad3d9fKBRsk9QKgI

Subscribe to the thread
{
  "type": "subscribe_thread",
  "thread_id": "5ab97a62-440d-45d8-96dd-fdb8648c89da"
}
Send Message
{
  "type": "send_message",
  "thread_id": "5ab97a62-440d-45d8-96dd-fdb8648c89da",
  "content": "Hello parent!",
  "message_type": "text"
}


{
    "status": "success",
    "data": {
        "student": {
            "id": "4b33eb05-b7f9-4092-b171-e10b461e8d3f",
            "admission_number": "2025057",
            "full_name": "Student 4",
            "date_of_birth": "2018-09-18",
            "admission_date": "2025-08-04",
            "status": "active",
            "created_at": "2025-08-04T11:53:00.374698+00:00"
        },
        "academic_record": {
            "id": "8c7e7ffa-7fd7-4185-a17b-b73402ee5eb8",
            "student_id": "4b33eb05-b7f9-4092-b171-e10b461e8d3f",
            "academic_year_id": null,
            "class_division_id": "4ded8472-fe26-4cf3-ad25-23f601960a0b",
            "roll_number": "08",
            "status": "ongoing",
            "created_at": "2025-08-04T11:53:01.081948+00:00"
        }
    }
}

Get all teachers
Get teacher assigned to the division
Get student details for a class division principal id
For parent principal id, teachers assigned for that class
How multiple subject teachers are assigned for the class division
