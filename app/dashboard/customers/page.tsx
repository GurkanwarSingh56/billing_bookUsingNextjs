import CustomersTable from "@/app/ui/customers/table";
import { fetchCustomersForTable } from "@/app/lib/data";
export default async function Page() {
    const customers = await fetchCustomersForTable();
    return <div>
        <CustomersTable customers={customers} />
    </div>
}
