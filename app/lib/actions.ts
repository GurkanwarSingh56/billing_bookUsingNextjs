'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import postgres from 'postgres';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import {CreateCustomerSchema, CustomerFormState} from "@/app/lib/definitions";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
      invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
      invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
  });


  const CreateInvoice = FormSchema.omit({ id: true, date: true });

  export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
  };

  export async function createInvoice(prevState: State, formData: FormData) {
    // Validate form using Zod
    const validatedFields = CreateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });

    // If form validation fails, return errors early. Otherwise, continue.
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
      };
    }

    // Prepare data for insertion into the database
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    // Insert data into the database
    try {
      await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
      `;
    } catch (error) {
      // If a database error occurs, return a more specific error.
      console.log('Database Error:', error);
      return {
        message: 'Database Error: Failed to Create Invoice.',
      };
    }

    // Revalidate the cache for the invoices page and redirect the user.
    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }

  const UpdateInvoice = FormSchema.omit({ id: true, date: true });

  export async function updateInvoice(id: string, formData: FormData) {
    const { customerId, amount, status } = UpdateInvoice.parse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
    });

    const amountInCents = amount * 100;

    try {
      await sql`
          UPDATE invoices
          SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
          WHERE id = ${id}
        `;
    } catch (error) {
      // We'll log the error to the console for now
      console.error(error);
    }

    revalidatePath('/dashboard/invoices');
    redirect('/dashboard/invoices');
  }

  export async function deleteInvoice(id: string) {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
  }

  export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', formData);
    } catch (error) {
      if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return 'Invalid credentials.';
          default:
            return 'Something went wrong.';
        }
      }
      throw error;
    }
  }

// Server Action to create a new customer
export async function createCustomer(
    prevState: CustomerFormState,
    formData: FormData,
): Promise<CustomerFormState> {
  // 1. Validate form data using Zod
  const validatedFields = CreateCustomerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    image_url: formData.get('image_url'),
  });

  // 2. If validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    console.log('Validation Errors:', validatedFields.error.flatten().fieldErrors);
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing or invalid fields. Failed to Create Customer.',
    };
  }

  // 3. Prepare data for insertion into the database
  const { name, email, image_url } = validatedFields.data;

  // 4. Insert data into the database
  try {
    // Note: Your 'customers' table should ideally auto-generate the 'id' (e.g., UUID)
    await sql`
      INSERT INTO customers (name, email, image_url)
      VALUES (${name}, ${email}, ${image_url})
    `;
  } catch (error) {
    console.error('Database Error:', error);
    // Handle specific errors if needed (e.g., duplicate email)
    if ((error as Error).message.includes('unique constraint')) {
      return { message: 'Database Error: Email address already exists.' };
    }
    return {
      message: 'Database Error: Failed to Create Customer.',
    };
  }

  // 5. Revalidate the cache for the customers page and redirect.
  revalidatePath('/dashboard/customers'); // Update the list page
  redirect('/dashboard/customers'); // Navigate back to the list
  // Redirect implicitly throws an error, so no need to return success state here
}

// Schema to validate the ID from FormData
const DeleteCustomerSchema = z.object({
  id: z.string().uuid({ message: 'Invalid Customer ID.' }), // Assuming IDs are UUIDs
});

export async function deleteCustomer(formData: FormData) {
  // Validate the ID
  const validatedFields = DeleteCustomerSchema.safeParse({
    id: formData.get('id'),
  });

  // If validation fails, log an error (won't show on UI without useFormState)
  if (!validatedFields.success) {
    console.error('Validation Error:', validatedFields.error.flatten().fieldErrors);
    // In a real app, you might want to return an error message
    // using useFormState if feedback is needed without a full reload.
    return {
      message: 'Invalid Customer ID. Failed to Delete Customer.',
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const id = validatedFields.data.id;

  try {
    // Attempt to delete the customer from the database
    await sql`DELETE FROM customers WHERE id = ${id}`;

    // Revalidate the path to update the UI
    revalidatePath('/dashboard/customers');
    // Optional: Return a success message if using useFormState
    return { message: 'Customer Deleted Successfully.' };

  } catch (error) {
    console.error('Database Error:', error);
    // Important: Deleting a customer might fail if they have associated invoices
    // due to foreign key constraints (ON DELETE RESTRICT).
    // Handle this specific error if needed, or return a generic message.
    if ((error as Error).message.includes('foreign key constraint')) {
      return { message: 'Database Error: Cannot delete customer with existing invoices.' };
    }
    return { message: 'Database Error: Failed to Delete Customer.' };
  }
}
