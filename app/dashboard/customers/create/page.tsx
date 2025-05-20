// app/dashboard/customers/create/page.tsx
import Form from '@/app/ui/customers/create-form'; // Using default import
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs'; // Assuming you have this
// import { fetchCustomers } from '@/app/lib/data'; // If needed for breadcrumbs/data
import { Metadata } from 'next';

// Optional: Add metadata for the page title
export const metadata: Metadata = {
    title: 'Create Customer',
};

export default async function Page() {
    // You might fetch other data here if needed for context or breadcrumbs

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Customers', href: '/dashboard/customers' },
                    {
                        label: 'Create Customer',
                        href: '/dashboard/customers/create',
                        active: true,
                    },
                ]}
            />
            {/* Render the form component */}
            <Form />
        </main>
    );
}
