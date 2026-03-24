'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import UniversityModal from '@/components/university/UniversityModal';
import { useDeleteUniversity } from '@/lib/hooks/useUniversities';
import type { UniversityDetail } from '@/types/api';

export default function DetailActions({ university }: { university: UniversityDetail }) {
  const [modal, setModal] = useState(false);
  const router            = useRouter();
  const toast             = useToast();
  const deleteMutation    = useDeleteUniversity();

  const handleDelete = async () => {
    if (!confirm(`Delete "${university.name}" and all its data? This cannot be undone.`)) return;
    try {
      await deleteMutation.trigger(university.id);
      toast.success('University deleted');
      router.push('/universities');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        leftIcon={<Pencil size={13} />}
        onClick={() => setModal(true)}
      >
        Edit
      </Button>
      <Button
        variant="danger"
        size="sm"
        leftIcon={<Trash2 size={13} />}
        loading={deleteMutation.isMutating}
        onClick={handleDelete}
      >
        Delete
      </Button>
      <UniversityModal
        open={modal}
        onClose={() => setModal(false)}
        initial={university}
      />
    </>
  );
}
