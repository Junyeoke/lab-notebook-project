package com.labnote.backend;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EntryVersionRepository extends JpaRepository<EntryVersion, Long> {
    List<EntryVersion> findByEntryOrderByVersionTimestampDesc(Entry entry);
}
