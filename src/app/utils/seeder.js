import bcrypt from 'bcryptjs';
import { getLocalDb, saveLocalDb, isSupabaseTableAvailable, supabase } from './dbFallback';

// Dynamic helper to seed everything
export async function seedDatabase() {
  try {
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash('Admin@123', salt);

    // 1. Check/Seed Users
    const useSupabase = await isSupabaseTableAvailable('aura_users');

    const defaultAdminEmail = 'admin@auraworkspace.local';
    const mainAdminEmail = 'chandrunavalarch@gmail.com';

    const seedUsersList = [
      {
        first_name: 'Super',
        last_name: 'Admin',
        username: 'admin',
        email: defaultAdminEmail,
        password_hash,
        status: 'Active',
        role: 'SuperAdmin',
        mobile_number: '',
        department: '',
        designation: '',
        employee_id: 'EMP-0001',
        reporting_manager: ''
      },
      {
        first_name: 'Chandru',
        last_name: 'Admin',
        username: 'chandru',
        email: mainAdminEmail,
        password_hash,
        status: 'Active',
        role: 'SuperAdmin',
        mobile_number: '',
        department: '',
        designation: '',
        employee_id: 'EMP-0002',
        reporting_manager: ''
      },
      {
        first_name: 'Jane',
        last_name: 'Manager',
        username: 'janemanager',
        email: 'jane@auraworkspace.local',
        password_hash,
        status: 'Active',
        role: 'Manager',
        mobile_number: '',
        department: 'Naval Architecture',
        designation: 'Department Head',
        employee_id: 'EMP-0003',
        reporting_manager: 'Super Admin'
      },
      {
        first_name: 'John',
        last_name: 'Supervisor',
        username: 'johnsupervisor',
        email: 'john@auraworkspace.local',
        password_hash,
        status: 'Active',
        role: 'Manager',
        mobile_number: '',
        department: 'Marine Engineering',
        designation: 'Project Manager',
        employee_id: 'EMP-0004',
        reporting_manager: 'Super Admin'
      },
      {
        first_name: 'Alice',
        last_name: 'Smith',
        username: 'alice',
        email: 'alice@auraworkspace.local',
        password_hash,
        status: 'Active',
        role: 'Employee',
        mobile_number: '',
        department: 'Naval Architecture',
        designation: 'Design Engineer',
        employee_id: 'EMP-0005',
        reporting_manager: 'Jane Manager'
      },
      {
        first_name: 'Bob',
        last_name: 'Jones',
        username: 'bob',
        email: 'bob@auraworkspace.local',
        password_hash,
        status: 'Active',
        role: 'Employee',
        mobile_number: '',
        department: 'Marine Engineering',
        designation: 'Design Engineer',
        employee_id: 'EMP-0006',
        reporting_manager: 'John Supervisor'
      },
      {
        first_name: 'Charlie',
        last_name: 'Brown',
        username: 'charlie',
        email: 'charlie@auraworkspace.local',
        password_hash,
        status: 'Active',
        role: 'Employee',
        mobile_number: '',
        department: 'Naval Architecture',
        designation: 'Junior Engineer',
        employee_id: 'EMP-0007',
        reporting_manager: 'Jane Manager'
      },
      {
        first_name: 'David',
        last_name: 'Miller',
        username: 'david',
        email: 'david@auraworkspace.local',
        password_hash,
        status: 'Active',
        role: 'Employee',
        mobile_number: '',
        department: 'Structural Engineering',
        designation: 'Senior Engineer',
        employee_id: 'EMP-0008',
        reporting_manager: 'Super Admin'
      },
      {
        first_name: 'Eve',
        last_name: 'Davis',
        username: 'eve',
        email: 'eve@auraworkspace.local',
        password_hash,
        status: 'Active',
        role: 'Employee',
        mobile_number: '',
        department: 'IT',
        designation: 'Administrator',
        employee_id: 'EMP-0009',
        reporting_manager: 'Super Admin'
      }
    ];

    if (useSupabase) {
      // Seed to Supabase aura_users
      for (const user of seedUsersList) {
        const { data: existing } = await supabase
          .from('aura_users')
          .select('id')
          .eq('email', user.email)
          .maybeSingle();

        if (!existing) {
          await supabase.from('aura_users').insert(user);
        }
      }
    } else {
      // Seed to local db.json
      const localDb = getLocalDb();
      if (!localDb.users || localDb.users.length === 0) {
        localDb.users = seedUsersList.map((u, index) => ({
          ...u,
          id: `u-${1000 + index}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        saveLocalDb(localDb);
      }
    }

    // 2. Seed Clients, Projects, Tasks (in Supabase if available)
    if (supabase) {
      // Check if clients exists and is empty
      const { data: clients } = await supabase.from('clients').select('id');
      if (clients && clients.length === 0) {
        const seedClients = [
          { name: 'Apex Shipping Group', email: 'billing@apex.com', phone: '+1-555-0199', company: 'Apex Shipping Inc', notes: 'Key maritime client', project_history: 'None yet' },
          { name: 'Oceanic Vessels Corp', email: 'contact@oceanic.com', phone: '+1-555-0144', company: 'Oceanic Vessels', notes: 'Offshore operations provider', project_history: 'None yet' }
        ];
        const { data: insertedClients } = await supabase.from('clients').insert(seedClients).select();

        if (insertedClients && insertedClients.length > 0) {
          const apexClientId = insertedClients[0].id;
          const oceanicClientId = insertedClients[1].id;

          // Seed Projects
          const { data: projects } = await supabase.from('projects').select('id');
          if (projects && projects.length === 0) {
            const seedProjects = [
              { title: 'Tugboat Hull Refinement', client_id: apexClientId, cad_type: 'AutoCAD 2D', status: 'In Progress', quote_amount: 15000, paid_amount: 5000, balance_amount: 10000, file_notes: 'Initial hull optimization project', progress: 35 },
              { title: 'Barge Structural Retrofit', client_id: oceanicClientId, cad_type: 'Rhino 3D', status: 'In Progress', quote_amount: 32000, paid_amount: 12000, balance_amount: 20000, file_notes: 'Retrofit drawings and design approval', progress: 50 }
            ];
            const { data: insertedProjects } = await supabase.from('projects').insert(seedProjects).select();

            if (insertedProjects && insertedProjects.length > 0) {
              const proj1Id = insertedProjects[0].id;
              const proj2Id = insertedProjects[1].id;

              // Seed Tasks
              const { data: tasks } = await supabase.from('tasks').select('id');
              if (tasks && tasks.length === 0) {
                const seedTasks = [
                  { title: 'Draft baseline hull curves', priority: 'High', due_date: new Date().toISOString().split('T')[0], completed: false, status: 'In Progress', completion_percentage: 45, qc_status: 'Not Checked', sent_to_qc: false, notes: '', project_id: proj1Id },
                  { title: 'FEA stress load calculations', priority: 'Medium', due_date: new Date().toISOString().split('T')[0], completed: false, status: 'In Progress', completion_percentage: 20, qc_status: 'Not Checked', sent_to_qc: false, notes: '', project_id: proj2Id },
                  { title: 'Prepare final blueprint approval drafts', priority: 'Low', due_date: new Date().toISOString().split('T')[0], completed: false, status: 'Pending', completion_percentage: 0, qc_status: 'Not Checked', sent_to_qc: false, notes: '', project_id: proj1Id }
                ];
                await supabase.from('tasks').insert(seedTasks);
              }
            }
          }
        }
      }
    }

    console.log("Seeding completed successfully.");
  } catch (err) {
    console.error("Database seeding failure:", err);
  }
}
