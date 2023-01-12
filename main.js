import { parse } from "csv-parse";
import { stringify } from "csv-stringify";
import fs from "fs";

const processFile = async (file) => {
  const records = [];
  const parser = fs.createReadStream(file).pipe(
    parse({
      columns: true,
      relax_quotes: true,
      quote: true,
      delimiter: "\t",
      relax_column_count: true,
      raw: true,
      on_record: ({ raw, record }, { error }) => {
        if (error && error.code === "CSV_RECORD_INCONSISTENT_FIELDS_LENGTH") {
          return raw.trim().split("\t");
        } else {
          return record;
        }
      },
    })
  );
  for await (const record of parser) {
    records.push(record);
  }
  return records;
};

(async () => {
  const recordsNsw = await processFile("./Nitendo switch/LocalizationNew-CAB-a8759935627de4ed3ac45e93d401a6b3-8667144087232685053.txt"
  );
  const recordsAndroid = await processFile("./Android/LocalizationNew.txt");

  recordsAndroid.map((recordAndroid, index) => {
    const recordNsw = recordsNsw.find(
      (record) => record["Text ID"] === recordAndroid["Text ID"]
    );
    if (!recordsAndroid[index]['Text ID']) {
      return;
    }
    if (!recordNsw) {
      console.log(
        `O diálogo no texto Android com Id \"${recordAndroid.Key_1}\" e valor \"${recordAndroid.Key_2}\" não tem equivalente na tradução!`
      );
      return;
    }
    if (recordAndroid.English === recordNsw.English) {
      return;
    }
    recordsAndroid[index].English = recordNsw.English;
  });

  stringify(
    recordsAndroid,
    {
      header: false,
      delimiter: "\t",
    },
    function (err, output) {
      if (err) console.log(err.message);
      fs.writeFileSync("./someData.csv", output);
    }
  );
})();
